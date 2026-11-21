"""
LectureLens Backend Inspector & Test Studio Server.
Lightweight isolated FastAPI workbench exercising:
- Offline Ingest Pipeline ([I1]-[I6]): FFmpeg DSP -> PhoWhisper-medium -> Recursive Chunking -> BGE-M3 -> ChunkStore
- Online 2-Pass Pre-RAG Pipeline ([Q1]-[Q6+], No Cache): Gemma 4 E2B Prep -> BGE-M3 + RRF -> Expand -> BGE-Reranker-v2-m3 -> Gemma 4 E2B + RAG -> Audit Logs
"""
import asyncio
from datetime import datetime, timezone
import logging
import os
from pathlib import Path
import struct
import sys
import time
from typing import Literal
import uuid

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, ConfigDict, Field

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ai_service.config import get_settings
from ai_service.core.asr import (
    DEFAULT_IT_PROMPT,
    FakeAsrEngine,
    PhoWhisperEngine,
    format_timestamp_label,
)
from ai_service.core.audio_store import LocalVolumeAudioStore
from ai_service.core.chunk_store import (
    CompositeChunkStore,
    InMemoryChunkStore,
    PostgresPgVectorChunkStore,
)
from ai_service.core.embedder import BgeM3Embedder, FakeEmbedder
from ai_service.core.llm_client import (
    CompositeLLMClient,
    EngineMode,
    FakeLLMClient,
    OllamaGemmaClient,
    TransformersGemmaClient,
)
from ai_service.core.model_registry import LocalModelRegistry
from ai_service.core.preprocessing import (
    FakeAudioPreprocessor,
    FFmpegAudioPreprocessor,
    resolve_ffmpeg_binary,
)
from ai_service.core.prompt_builder import (
    GroundedPromptBuilder,
    LLMStageConfig,
    PromptProfile,
    ResponseFormat,
)
from ai_service.core.reranker import BgeRerankerV2M3, FakeReranker
from ai_service.core.schemas import (
    RagQueryRequest,
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
    TranscriptSegment,
)
from ai_service.core.telemetry_store import (
    CompositeTelemetryStore,
    InMemoryTelemetryStore,
    PostgresTelemetryStore,
)
from ai_service.core.text_chunker import (
    BgeM3TokenizerAdapter,
    RecursiveTokenChunker,
    WhitespaceApproxTokenizer,
)
from ai_service.core.vad_chunker import EnergyVadChunker
from ai_service.pipeline.ingest_pipeline import (
    IngestPipelineCoordinator,
    PipelineObserverProtocol,
    PipelineTraceEvent,
)
from ai_service.pipeline.rag_pipeline import RagPipelineCoordinator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("test_server")

app = FastAPI(title="LectureLens BE Inspector & Test Workbench")
settings = get_settings()
model_registry = LocalModelRegistry(settings=settings)


def _resolve_storage_root() -> Path:
    env_root = os.getenv("STORAGE_ROOT")
    if env_root:
        return Path(env_root)
    return Path(settings.STORAGE_ROOT)


def _resolve_phowhisper_path() -> Path:
    env_path = os.getenv("MODEL_PATH_PHOWHISPER")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    return Path(settings.MODEL_PATH_PHOWHISPER)


def _resolve_bge_m3_path() -> Path:
    env_path = os.getenv("MODEL_PATH_BGE_M3")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    return Path(settings.MODEL_PATH_BGE_M3)


def _resolve_reranker_path() -> Path:
    env_path = os.getenv("MODEL_PATH_RERANKER")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    return Path(settings.MODEL_PATH_RERANKER)


def _resolve_gemma_path() -> Path:
    env_path = os.getenv("MODEL_PATH_GEMMA")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    return Path(settings.MODEL_PATH_GEMMA)


def _resolve_runtime_device() -> str:
    configured = os.getenv("DEVICE", settings.DEVICE).lower()
    if configured == "cpu":
        return "cpu"
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass
    return "cpu"


STORAGE_ROOT = _resolve_storage_root()
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
audio_store = LocalVolumeAudioStore(storage_root=STORAGE_ROOT)

postgres_store = (
    PostgresPgVectorChunkStore(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
    )
    if settings.ENABLE_PGVECTOR_SYNC
    else None
)
chunk_store = CompositeChunkStore(
    memory_store=InMemoryChunkStore(),
    postgres_store=postgres_store,
    enable_pgvector=settings.ENABLE_PGVECTOR_SYNC,
)

telemetry_store = CompositeTelemetryStore(
    memory_store=InMemoryTelemetryStore(),
    postgres_store=(
        PostgresTelemetryStore(
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            dbname=settings.POSTGRES_DB,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
        )
        if settings.ENABLE_PGVECTOR_SYNC
        else None
    ),
    enable_pgvector=settings.ENABLE_PGVECTOR_SYNC,
)

# Cached lazy-loaded real & fake adapters
_real_tokenizer: BgeM3TokenizerAdapter | None = None
_real_embedder: BgeM3Embedder | None = None
_real_reranker: BgeRerankerV2M3 | None = None
_last_asr_engine: PhoWhisperEngine | None = None
_fake_embedder = FakeEmbedder()
_fake_reranker = FakeReranker()
_prompt_builder = GroundedPromptBuilder()

_ollama_client = OllamaGemmaClient(
    base_url=os.getenv("OLLAMA_BASE_URL", settings.OLLAMA_BASE_URL),
    model=os.getenv("OLLAMA_MODEL", settings.OLLAMA_MODEL),
)
_transformers_gemma = TransformersGemmaClient(
    model_path=_resolve_gemma_path(),
    device=_resolve_runtime_device(),
)
_raw_llm_mode = os.getenv("LLM_ENGINE_MODE", settings.LLM_ENGINE_MODE).lower()
_configured_llm_mode: EngineMode = (
    _raw_llm_mode if _raw_llm_mode in ("auto", "ollama", "transformers", "mock") else "auto"  # type: ignore[assignment]
)
_llm_client = CompositeLLMClient(
    mode=_configured_llm_mode,
    ollama_client=_ollama_client,
    transformers_client=_transformers_gemma,
    mock_client=FakeLLMClient(),
)

rag_coordinator = RagPipelineCoordinator(
    embedder=_fake_embedder,
    chunk_store=chunk_store,
    reranker=_fake_reranker,
    prompt_builder=_prompt_builder,
    llm_client=_llm_client,
    telemetry_store=telemetry_store,
    low_vram_mode=settings.LOW_VRAM_MODE,
    default_retrieval_top_k=settings.RAG_RETRIEVAL_TOP_K,
    query_prep_model=os.getenv("OLLAMA_QUERY_PREP_MODEL", settings.OLLAMA_QUERY_PREP_MODEL),
)

# Canonical session telemetry & trackers
_CANONICAL_MODELS = ("phowhisper-medium", "bge-m3", "bge-reranker-v2-m3", "gemma-4-e2b")
_INGEST_BLUEPRINT = [
    {"step_id": "register", "code": "I1", "label": "AudioStore Register", "stage": "Stage 1", "model_key": None},
    {"step_id": "normalize", "code": "I2", "label": "FFmpeg 16kHz DSP", "stage": "Stage 1", "model_key": None},
    {"step_id": "asr", "code": "I4", "label": "PhoWhisper-medium ASR", "stage": "Stage 1", "model_key": "phowhisper-medium"},
    {"step_id": "vram_offload", "code": "VRAM", "label": "ASR VRAM Offload", "stage": "Stage 1->2", "model_key": "phowhisper-medium"},
    {"step_id": "chunking", "code": "I5", "label": "Recursive Chunker", "stage": "Stage 2", "model_key": None},
    {"step_id": "embedding", "code": "I6", "label": "BGE-M3 Dual Embed", "stage": "Stage 2", "model_key": "bge-m3"},
    {"step_id": "store_sync", "code": "DB", "label": "chunks.json + PgVector", "stage": "Stage 2", "model_key": None},
]
_RAG_BLUEPRINT = [
    {"step_id": "q1_query_prep", "code": "Q1", "label": "Gemma 4 Query Prep", "stage": "Online Pass 1", "model_key": "gemma-4-e2b"},
    {"step_id": "q2_embed_rrf", "code": "Q2", "label": "BGE-M3 + 3-Stream RRF", "stage": "Online Retrieval", "model_key": "bge-m3"},
    {"step_id": "q3_expand_ctx", "code": "Q3", "label": "3-Way Context Expand", "stage": "Online Retrieval", "model_key": None},
    {"step_id": "q4_rerank", "code": "Q4", "label": "BGE-Reranker-v2-m3", "stage": "Online Rerank", "model_key": "bge-reranker-v2-m3"},
    {"step_id": "q5_rag_answer", "code": "Q5", "label": "Gemma 4 + RAG Synthesis", "stage": "Online Pass 2", "model_key": "gemma-4-e2b"},
    {"step_id": "q6_extra_stages", "code": "Q6+", "label": "Extra Prompt Stages", "stage": "Online Extensible", "model_key": "gemma-4-e2b"},
    {"step_id": "audit_log", "code": "LOG", "label": "rag.rag_audit_logs", "stage": "Audit", "model_key": None},
]


def _default_model_stat() -> dict:
    return {
        "run_count": 0,
        "real_runs": 0,
        "mock_runs": 0,
        "total_duration_ms": 0.0,
        "last_duration_ms": None,
        "last_device": None,
        "last_engine": None,
        "last_stage": None,
        "last_mode": None,
        "last_run_at": None,
    }


session_model_stats: dict[str, dict] = {k: _default_model_stat() for k in _CANONICAL_MODELS}
job_state_tracker: dict[str, dict] = {}
job_trace_tracker: dict[str, "RunTraceRecorder"] = {}
recent_jobs: list[str] = []
recent_rag_runs: list[dict] = []


def _record_model_run(
    model_key: str,
    *,
    stage: str,
    duration_ms: float,
    device: str,
    engine: str,
    mode: Literal["real", "mock"],
) -> None:
    if model_key not in session_model_stats:
        session_model_stats[model_key] = _default_model_stat()
    stat = session_model_stats[model_key]
    stat["run_count"] += 1
    if mode == "real":
        stat["real_runs"] += 1
    else:
        stat["mock_runs"] += 1
    stat["total_duration_ms"] = round(stat["total_duration_ms"] + duration_ms, 2)
    stat["last_duration_ms"] = round(duration_ms, 2)
    stat["last_device"] = device
    stat["last_engine"] = engine
    stat["last_stage"] = stage
    stat["last_mode"] = mode
    stat["last_run_at"] = datetime.now(timezone.utc).isoformat()


def _is_model_loaded(model_key: str) -> bool:
    if model_key == "phowhisper-medium":
        return bool(_last_asr_engine is not None and _last_asr_engine.is_loaded)
    if model_key == "bge-m3":
        return bool(_real_embedder is not None and _real_embedder.is_loaded)
    if model_key == "bge-reranker-v2-m3":
        return bool(_real_reranker is not None and _real_reranker.is_loaded)
    if model_key == "gemma-4-e2b":
        return bool(_transformers_gemma.is_loaded)
    return False


class RunTraceRecorder:
    """PipelineObserverProtocol adapter recording step-level BE trace for one job."""

    def __init__(self, job_id: str, lecture_id: str, mode: str, source: str) -> None:
        self.job_id = job_id
        self.lecture_id = lecture_id
        self.mode = mode
        self.source = source
        self.created_at = datetime.now(timezone.utc).isoformat()
        self.started_perf = time.perf_counter()
        self.steps: dict[str, dict] = {
            bp["step_id"]: {
                "step_id": bp["step_id"],
                "code": bp["code"],
                "label": bp["label"],
                "stage": bp["stage"],
                "pipeline": "ingest",
                "status": "pending",
                "model_used": None,
                "adapter": None,
                "device": None,
                "dtype": None,
                "duration_ms": None,
                "in_summary": None,
                "out_summary": None,
                "notes": None,
                "timestamp": None,
            }
            for bp in _INGEST_BLUEPRINT
        }
        self.state_transitions: list[dict] = []

    def mark_skipped(self, step_id: str, notes: str) -> None:
        if step_id in self.steps:
            self.steps[step_id]["status"] = "skipped"
            self.steps[step_id]["notes"] = notes
            self.steps[step_id]["timestamp"] = datetime.now(timezone.utc).isoformat()

    def record_transition(self, status: str, progress: int, message: str) -> None:
        self.state_transitions.append(
            {
                "status": status,
                "progress": progress,
                "message": message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def emit(self, event: PipelineTraceEvent) -> None:
        existing = self.steps.get(event.step_id) or {
            "step_id": event.step_id,
            "code": event.step_id.upper(),
            "label": event.label,
            "stage": event.stage,
            "pipeline": "ingest",
        }
        existing.update(
            {
                "status": event.status,
                "model_used": event.model_used,
                "adapter": event.adapter,
                "device": event.device,
                "dtype": event.dtype,
                "duration_ms": event.duration_ms,
                "in_summary": event.in_summary,
                "out_summary": event.out_summary,
                "notes": event.notes,
                "timestamp": event.timestamp,
            }
        )
        self.steps[event.step_id] = existing

        if event.status == "done" and event.model_used:
            run_mode: Literal["real", "mock"] = "mock" if event.model_used.startswith("fake-") else "real"
            canonical_key = (
                "phowhisper-medium"
                if event.step_id == "asr"
                else ("bge-m3" if event.step_id == "embedding" else None)
            )
            if canonical_key and event.step_id in ("asr", "embedding"):
                _record_model_run(
                    canonical_key,
                    stage=event.stage,
                    duration_ms=float(event.duration_ms or 0.0),
                    device=event.device or "cpu",
                    engine=event.adapter or run_mode,
                    mode=run_mode,
                )

    def models_executed(self) -> list[dict]:
        executed: list[dict] = []
        offload_done = self.steps.get("vram_offload", {}).get("status") == "done"
        for step_id in ("asr", "embedding"):
            step = self.steps.get(step_id)
            if step and step.get("status") == "done" and step.get("model_used"):
                executed.append(
                    {
                        "model_key": step["model_used"],
                        "adapter": step.get("adapter"),
                        "stage": f"{step.get('code', '')} {step.get('stage', '')}".strip(),
                        "device": step.get("device"),
                        "dtype": step.get("dtype"),
                        "duration_ms": step.get("duration_ms"),
                        "unloaded": offload_done if step_id == "asr" else False,
                    }
                )
        return executed

    def total_duration_ms(self) -> float:
        step_sum = sum(
            float(s["duration_ms"])
            for s in self.steps.values()
            if isinstance(s.get("duration_ms"), (int, float))
        )
        return round(step_sum, 2)

    def to_dict(self) -> dict:
        return {
            "job_id": self.job_id,
            "lecture_id": self.lecture_id,
            "mode": self.mode,
            "source": self.source,
            "created_at": self.created_at,
            "total_duration_ms": self.total_duration_ms(),
            "steps": list(self.steps.values()),
            "models_executed": self.models_executed(),
            "state_transitions": self.state_transitions,
        }


def _register_recent_job(job_id_str: str) -> None:
    if job_id_str in recent_jobs:
        recent_jobs.remove(job_id_str)
    recent_jobs.insert(0, job_id_str)
    del recent_jobs[25:]


def get_real_text_chunker() -> RecursiveTokenChunker:
    global _real_tokenizer
    if _real_tokenizer is None:
        _real_tokenizer = BgeM3TokenizerAdapter(model_path=_resolve_bge_m3_path())
    return RecursiveTokenChunker(
        tokenizer=_real_tokenizer,
        max_tokens=settings.CHUNK_MAX_TOKENS,
        overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
    )


def get_real_embedder() -> BgeM3Embedder:
    global _real_embedder
    device = _resolve_runtime_device()
    if _real_embedder is None:
        _real_embedder = BgeM3Embedder(
            model_path=_resolve_bge_m3_path(),
            device=device,
            max_length=settings.CHUNK_MAX_TOKENS,
        )
    return _real_embedder


def get_real_reranker() -> BgeRerankerV2M3:
    global _real_reranker
    device = _resolve_runtime_device()
    if _real_reranker is None:
        _real_reranker = BgeRerankerV2M3(
            model_path=_resolve_reranker_path(),
            device=device,
        )
    return _real_reranker


def _build_silent_wav_bytes(duration_sec: float = 0.25, sample_rate: int = 16000) -> bytes:
    num_samples = max(1, int(duration_sec * sample_rate))
    data_size = num_samples * 2
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        1,
        sample_rate,
        sample_rate * 2,
        2,
        16,
        b"data",
        data_size,
    )
    return header + (b"\x00\x00" * num_samples)


SAMPLE_VIETNAMESE_SEGMENTS: list[str] = [
    (
        "Chào mừng các em sinh viên đến với học phần Hệ Thống Thông Tin và Mạng Máy Tính nâng cao. "
        "Trong chương mở đầu hôm nay, chúng ta sẽ ôn tập kiến trúc phân tầng OSI bảy lớp và mô hình TCP/IP "
        "đang vận hành trên toàn bộ mạng Internet hiện đại. Giao thức TCP đảm bảo truyền dữ liệu tin cậy "
        "thông qua cơ chế bắt tay ba bước SYN, SYN-ACK, ACK, đánh số thứ tự gói tin và kiểm soát tắc nghẽn "
        "theo cửa sổ trượt, giúp các ứng dụng web và cơ sở dữ liệu phân tán không bị mất gói."
    ),
    (
        "Khi thiết kế hạ tầng mạng doanh nghiệp, kỹ sư hệ thống phải thực hiện chia mạng con subnetting "
        "bằng mặt nạ mạng subnet mask và ký hiệu CIDR nhằm tối ưu không gian địa chỉ IPv4 và cô lập miền broadcast. "
        "Ví dụ với tiền tố /24 chúng ta có 254 địa chỉ host khả dụng, còn khi chia nhỏ thành bốn subnet /26 "
        "thì mỗi phân đoạn mạng phòng ban chỉ chứa tối đa 62 thiết bị, giảm thiểu xung đột lưu lượng nội bộ."
    ),
    (
        "Tiếp theo là dịch vụ phân giải tên miền DNS và cấp phát địa chỉ động DHCP trong mạng nội bộ LAN. "
        "Máy chủ DHCP tự động cấp phát IP, Default Gateway và DNS Server cho hàng nghìn máy trạm khi khởi động, "
        "trong khi DNS chuyển đổi tên miền dễ nhớ như portal.university.edu.vn thành địa chỉ IP tương ứng "
        "thông qua các bản ghi A, AAAA, CNAME và SRV phục vụ định vị dịch vụ trong hệ thống lớn."
    ),
    (
        "Chuyển sang phần Quản trị Windows Server, trọng tâm cốt lõi là dịch vụ thư mục Active Directory Domain Services. "
        "Domain Controller đóng vai trò máy chủ xác thực trung tâm, lưu giữ cơ sở dữ liệu NTDS.dit chứa toàn bộ "
        "tài khoản người dùng Users, nhóm bảo mật Groups, máy tính thành viên và các chính sách Group Policy Object. "
        "Mọi yêu cầu đăng nhập từ máy trạm đều đi qua giao thức Kerberos để cấp phát vé xác thực an toàn."
    ),
    (
        "Để phân cấp quản trị khoa học trong Active Directory, quản trị viên tổ chức các đối tượng vào "
        "những đơn vị tổ chức Organizational Unit gọi tắt là OU theo sơ đồ phòng ban hoặc theo chức năng. "
        "Nhờ kết hợp OU với Group Policy Object, chúng ta có thể áp đặt đồng bộ quy tắc độ phức tạp mật khẩu, "
        "giới hạn quyền Administrator cục bộ, cấu hình tường lửa và ánh xạ ổ đĩa dùng chung cho hàng trăm máy sinh viên."
    ),
    (
        "Khi cấp quyền truy cập tài nguyên chia sẻ trong Active Directory, chúng ta luôn tuân thủ mô hình "
        "AGDLP tức là đưa tài khoản vào Global Group, lồng vào Domain Local Group và gán quyền Permissions trên thư mục. "
        "Việc kiểm tra thuộc tính Member Of của một tài khoản giúp quản trị viên rà soát nhanh phạm vi phân quyền, "
        "tránh tình trạng cấp thừa đặc quyền Domain Admin gây rủi ro leo thang đặc quyền trong mạng trường học."
    ),
    (
        "Trong phần hai của bài giảng, chúng ta chuyển sang nền tảng Toán cho Trí Tuệ Nhân Tạo với chủ đề "
        "Đại Số Tuyến Tính và Không Gian Vector. Một không gian vector V trên trường số thực được trang bị "
        "hai phép toán cộng hai vector và nhân vô hướng thỏa mãn tám tiên đề đại số cơ bản. "
        "Các vector biểu diễn ngữ nghĩa câu văn từ mô hình ngôn ngữ lớn chính là các điểm nằm trong không gian nhiều chiều này."
    ),
    (
        "Khái niệm then chốt tiếp theo là độc lập tuyến tính và hệ sinh của một không gian vector. "
        "Một hệ gồm k vector được gọi là độc lập tuyến tính nếu tổ hợp tuyến tính của chúng bằng vector không "
        "chỉ xảy ra khi mọi hệ số vô hướng đều đồng thời bằng không. Nếu hệ vector vừa độc lập tuyến tính vừa sinh ra "
        "toàn bộ không gian V thì nó tạo thành một cơ sở basis, và số vector trong cơ sở chính là số chiều của không gian."
    ),
    (
        "Để đo lường mức độ tương đồng giữa hai vector nhúng 1024 chiều sinh ra bởi mô hình BGE-M3, "
        "hệ thống truy xuất thông tin sử dụng chuẩn Euclidean L2 norm và độ đo Cosine Similarity. "
        "Khi toàn bộ vector đã được chuẩn hóa về độ dài đơn vị bằng một, phép tính tích vô hướng dot product "
        "trở nên tương đương với Cosine Similarity, cho phép chỉ mục HNSW tìm kiếm láng giềng gần nhất chỉ trong vài mili-giây."
    ),
    (
        "Phép chiếu trực giao và khai triển giá trị kỳ dị SVD cũng giữ vai trò đặc biệt trong giảm chiều dữ liệu "
        "và nén biểu diễn vector mà vẫn bảo toàn phương sai thông tin quan trọng nhất. Trong cơ sở dữ liệu pgvector, "
        "việc chuyển đổi lưu trữ từ float32 sang halfvec FP16 giúp tiết kiệm một nửa dung lượng RAM của đồ thị HNSW "
        "mà vẫn giữ độ chính xác truy hồi recall trên chín mươi chín phẩy hai phần trăm."
    ),
    (
        "Chuyển sang chương cuối về Tối Ưu Hóa Học Máy, chúng ta phân tích thuật toán Gradient Descent "
        "dùng để cực tiểu hóa hàm mất mát loss function trong quá trình huấn luyện mạng nơ-ron sâu. "
        "Tại mỗi vòng lặp, vector tham số mô hình được cập nhật theo hướng ngược chiều với vector đạo hàm riêng gradient, "
        "vì gradient chỉ hướng tăng dốc nhất của bề mặt hàm mục tiêu trong không gian tham số nhiều chiều."
    ),
    (
        "Hệ số tốc độ học learning rate ký hiệu alpha quyết định độ dài bước nhảy của thuật toán Gradient Descent. "
        "Nếu chọn learning rate quá lớn, quá trình tối ưu sẽ dao động mạnh quanh điểm cực tiểu và có thể phân kỳ; "
        "ngược lại nếu learning rate quá nhỏ thì tốc độ hội tụ rất chậm và dễ mắc kẹt tại các điểm yên ngựa "
        "hoặc cực tiểu địa phương kém tối ưu trên bề mặt hàm mất mát phi lồi."
    ),
    (
        "Trong thực tế huấn luyện với tập dữ liệu lớn hàng triệu mẫu, biến thể Stochastic Gradient Descent "
        "và Mini-batch Gradient Descent kết hợp với bộ tối ưu Adam sử dụng momentum bậc nhất và bậc hai "
        "được ưu tiên sử dụng. Cách tiếp cận mini-batch vừa tận dụng khả năng tính toán song song trên GPU "
        "vừa tạo ra nhiễu có lợi giúp thoát khỏi các vùng phẳng gradient bằng không."
    ),
    (
        "Tổng kết buổi học hôm nay: các em hãy thực hành kết hợp kiến thức mạng TCP/IP, phân quyền Active Directory "
        "và biểu diễn không gian vector để hiểu trọn vẹn cách LectureLens số hóa bài giảng tiếng Việt. "
        "Bài tập về nhà yêu cầu chứng minh bất đẳng thức Cauchy-Schwarz trong không gian tích trong và cài đặt "
        "thuật toán tìm kiếm lai ba luồng kết hợp Dense Vector, Lexical Full-Text và Fuzzy Trigram RRF."
    ),
]


def _ensure_lecture_loaded_in_store(lecture_id: uuid.UUID) -> int:
    existing = chunk_store.get_lecture_chunks(lecture_id)
    if existing:
        return len(existing)

    chunks_root = STORAGE_ROOT / "chunks"
    if not chunks_root.exists():
        return 0

    for candidate_file in chunks_root.glob("*/chunks.json"):
        try:
            job_uuid = uuid.UUID(candidate_file.parent.name)
        except ValueError:
            continue
        artifact = audio_store.load_chunks(job_uuid)
        if artifact and artifact.lecture_id == lecture_id and artifact.chunks:
            chunk_store.memory_store.save_lecture_chunks(lecture_id, artifact.chunks)
            return len(artifact.chunks)
    return 0


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    template_path = Path(__file__).parent / "templates" / "index.html"
    return HTMLResponse(content=template_path.read_text(encoding="utf-8"))


@app.get("/api/system-diagnostics")
async def get_system_diagnostics():
    """Returns runtime telemetry, BE configuration, 4-model registry + session stats, and dual pipeline blueprint."""
    catalog = model_registry.inspect_all()
    ffmpeg_bin = resolve_ffmpeg_binary()
    ffmpeg_available = Path(ffmpeg_bin).exists() if ffmpeg_bin else False

    torch_installed = False
    torch_version = None
    cuda_available = False
    device_name = f"CPU ({os.cpu_count() or 1} vCPUs)"
    vram_mb = 0
    vram_allocated_mb = 0.0
    vram_reserved_mb = 0.0
    try:
        import torch

        torch_installed = True
        torch_version = getattr(torch, "__version__", None)
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
            vram_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
            vram_allocated_mb = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
            vram_reserved_mb = round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2)
    except ImportError:
        pass

    ollama_available = _ollama_client.is_available(timeout_seconds=0.6)
    pg_connected = chunk_store.is_postgres_connected()

    model_items: list[dict] = []
    for report in catalog.models:
        item = report.model_dump(mode="json")
        item["loaded_in_memory"] = _is_model_loaded(report.key)
        item["session_stats"] = session_model_stats.get(report.key, _default_model_stat())
        model_items.append(item)

    return {
        "runtime": {
            "python_version": catalog.python_version,
            "transformers_version": catalog.transformers_version,
            "torch_installed": torch_installed,
            "torch_version": torch_version,
            "cuda_available": cuda_available,
            "device": "cuda" if cuda_available else "cpu",
            "device_name": device_name,
            "vram_mb": vram_mb,
            "vram_allocated_mb": vram_allocated_mb,
            "vram_reserved_mb": vram_reserved_mb,
            "cpu_count": os.cpu_count() or 1,
            "omp_num_threads": os.getenv("OMP_NUM_THREADS", "default"),
            "mkl_num_threads": os.getenv("MKL_NUM_THREADS", "default"),
            "torch_num_threads": os.getenv("TORCH_NUM_THREADS", "default"),
        },
        "be_config": {
            "device_configured": os.getenv("DEVICE", settings.DEVICE),
            "low_vram_mode": settings.LOW_VRAM_MODE,
            "llm_engine_mode": _configured_llm_mode,
            "ollama_base_url": _ollama_client.base_url,
            "ollama_model": _ollama_client.model,
            "ollama_available": ollama_available,
            "rag_retrieval_top_k": settings.RAG_RETRIEVAL_TOP_K,
            "chunk_max_tokens": settings.CHUNK_MAX_TOKENS,
            "chunk_overlap_tokens": settings.CHUNK_OVERLAP_TOKENS,
            "whisper_chunk_seconds": settings.WHISPER_CHUNK_SECONDS,
            "whisper_stride_seconds": settings.WHISPER_STRIDE_SECONDS,
            "max_audio_duration_hours": settings.MAX_AUDIO_DURATION_HOURS,
            "enable_pgvector_sync": settings.ENABLE_PGVECTOR_SYNC,
            "storage_root": str(STORAGE_ROOT),
            "gpu_semaphore_limit": 1,
            "semantic_cache_enabled": False,
        },
        "ffmpeg": {
            "available": ffmpeg_available,
            "binary": ffmpeg_bin,
            "is_bundled": "imageio_ffmpeg" in (ffmpeg_bin or "").lower(),
        },
        "database": {
            "postgres_pgvector_connected": pg_connected,
            "backend_mode": "postgres_pgvector" if pg_connected else "in_memory_fallback",
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "dbname": settings.POSTGRES_DB,
        },
        "models": {
            "total_disk_mb": catalog.total_disk_mb,
            "total_disk_gb": catalog.total_disk_gb,
            "active_count": catalog.active_count,
            "staged_count": catalog.staged_count,
            "ready_on_disk_count": catalog.ready_on_disk_count,
            "items": model_items,
        },
        "pipeline_blueprint": {
            "ingest": _INGEST_BLUEPRINT,
            "rag_query": _RAG_BLUEPRINT,
        },
        "default_prompt": DEFAULT_IT_PROMPT,
    }


@app.get("/api/jobs")
async def list_recent_jobs():
    """Returns recent ingest/Stage 2 test runs with executed models and timings."""
    items: list[dict] = []
    for job_id_str in recent_jobs:
        state = job_state_tracker.get(job_id_str, {})
        recorder = job_trace_tracker.get(job_id_str)
        chunks_count = None
        try:
            art = audio_store.load_chunks(uuid.UUID(job_id_str))
            if art is not None:
                chunks_count = art.total_chunks
        except Exception:
            pass
        items.append(
            {
                "jobId": job_id_str,
                "lectureId": state.get("lectureId"),
                "filename": state.get("filename"),
                "source": recorder.source if recorder else "upload",
                "mode": recorder.mode if recorder else state.get("mode", "real"),
                "status": state.get("status", "UNKNOWN"),
                "progress": state.get("progress", 0),
                "total_chunks": chunks_count,
                "total_duration_ms": recorder.total_duration_ms() if recorder else None,
                "models_executed": recorder.models_executed() if recorder else [],
                "created_at": recorder.created_at if recorder else None,
            }
        )
    return {
        "jobs": items,
        "recent_rag_runs": recent_rag_runs[:10],
    }


@app.get("/api/sample-audio")
async def get_sample_audio():
    sample_file = PROJECT_ROOT / "backend" / "tests" / "fixtures" / "sample_lecture_vi.wav"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample audio fixture not found.")
    return FileResponse(
        path=str(sample_file),
        media_type="audio/wav",
        filename="sample_lecture_vi.wav",
    )


@app.post("/api/upload")
async def upload_audio(file: UploadFile = File(...)):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    job_id_str = str(job_id)

    ext = Path(file.filename or "audio.wav").suffix.lstrip(".").lower() or "wav"

    incoming_path = audio_store.get_incoming_path(job_id, ext)
    incoming_path.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    incoming_path.write_bytes(content)

    job_state_tracker[job_id_str] = {
        "jobId": job_id_str,
        "lectureId": str(lecture_id),
        "filename": file.filename or f"{job_id}.{ext}",
        "extension": ext,
        "progress": 5,
        "status": "QUEUED",
        "message": f"Tệp {file.filename} đã tiếp nhận vào incoming volume.",
        "errorMessage": None,
    }
    job_trace_tracker[job_id_str] = RunTraceRecorder(
        job_id=job_id_str,
        lecture_id=str(lecture_id),
        mode="pending",
        source="upload",
    )
    _register_recent_job(job_id_str)

    logger.info("Uploaded test audio for job %s (size: %d bytes)", job_id, len(content))
    return {
        "jobId": job_id_str,
        "lectureId": str(lecture_id),
        "filename": file.filename,
        "sizeBytes": len(content),
    }


class StateTrackingJobReporter:
    """Reporter adapter updating the in-memory web tracker and RunTraceRecorder transitions."""

    _STAGE_MESSAGES = {
        "PROCESSING_STT": "Stage 1: Chuẩn hóa DSP 16kHz & PhoWhisper-medium ASR...",
        "STT_COMPLETED": "Hoàn tất Stage 1 (transcript.json). Chuẩn bị offload & Stage 2...",
        "CHUNKING": "Stage 2 [I5]: RecursiveTokenChunker (<=512 tokens, 64 overlap)...",
        "EMBEDDING": "Stage 2 [I6]: BGE-M3 Dual Embedding halfvec(1024) + lexical_weights...",
        "READY": "Hoàn tất Stage 1 + Stage 2! Đã lưu chunks.json & ChunkStore.",
        "FAILED": "Pipeline gặp sự cố.",
    }

    def __init__(self, job_id_str: str, recorder: RunTraceRecorder | None = None):
        self.job_id_str = job_id_str
        self.recorder = recorder

    async def report(
        self,
        job_id: uuid.UUID,
        status: str,
        progress: int,
        error_message: str | None = None,
    ) -> bool:
        msg = self._STAGE_MESSAGES.get(status, status)
        if self.job_id_str in job_state_tracker:
            job_state_tracker[self.job_id_str]["progress"] = progress
            job_state_tracker[self.job_id_str]["status"] = status
            job_state_tracker[self.job_id_str]["message"] = msg
            if error_message:
                job_state_tracker[self.job_id_str]["errorMessage"] = error_message
        if self.recorder is not None:
            self.recorder.record_transition(status, progress, error_message or msg)
        return True


class PipelineRunConfig(BaseModel):
    mode: Literal["real", "mock"] = "real"
    dsp: bool = True
    vad: bool = True
    prompt: str | None = None


async def run_pipeline_task(
    job_id: uuid.UUID,
    lecture_id: uuid.UUID,
    ext: str,
    cfg: PipelineRunConfig,
):
    global _last_asr_engine
    job_id_str = str(job_id)
    recorder = job_trace_tracker.get(job_id_str) or RunTraceRecorder(
        job_id=job_id_str,
        lecture_id=str(lecture_id),
        mode=cfg.mode,
        source="upload",
    )
    recorder.mode = cfg.mode
    job_trace_tracker[job_id_str] = recorder
    reporter = StateTrackingJobReporter(job_id_str, recorder=recorder)

    if cfg.mode == "real":
        logger.info(
            "Initializing REAL Full Pipeline for job %s (phowhisper-medium, dsp=%s, vad=%s)...",
            job_id,
            cfg.dsp,
            cfg.vad,
        )
        preprocessor = FFmpegAudioPreprocessor(enable_dsp_filters=cfg.dsp)
        model_path = _resolve_phowhisper_path()
        device = _resolve_runtime_device()
        vad_chunker = EnergyVadChunker() if cfg.vad else None
        prompt_text = cfg.prompt if cfg.prompt is not None else DEFAULT_IT_PROMPT

        asr_engine = PhoWhisperEngine(
            model_path=model_path,
            device=device,
            vad_chunker=vad_chunker,
            prompt=prompt_text,
        )
        _last_asr_engine = asr_engine
        text_chunker = get_real_text_chunker()
        embedder = get_real_embedder()
    else:
        logger.info("Initializing FAST MOCK Full Pipeline for job %s...", job_id)
        preprocessor = FakeAudioPreprocessor(synthetic_duration_seconds=36.0)
        asr_engine = FakeAsrEngine(synthetic_segments=SAMPLE_VIETNAMESE_SEGMENTS[:6])
        text_chunker = RecursiveTokenChunker(
            tokenizer=WhitespaceApproxTokenizer(),
            max_tokens=settings.CHUNK_MAX_TOKENS,
            overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
        )
        embedder = FakeEmbedder()

    coordinator = IngestPipelineCoordinator(
        audio_store=audio_store,
        preprocessor=preprocessor,
        asr_engine=asr_engine,
        job_reporter=reporter,
        text_chunker=text_chunker,
        embedder=embedder,
        chunk_store=chunk_store,
        low_vram_mode=settings.LOW_VRAM_MODE,
        observer=recorder,
    )

    await coordinator.run(job_id, lecture_id, ext)


@app.post("/api/process/{job_id}")
async def process_audio(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    mode: Literal["real", "mock"] = Query("real"),
    dsp: bool = Query(True),
    vad: bool = Query(True),
    prompt: str | None = Query(None),
):
    job_id_str = str(job_id)
    if job_id_str not in job_state_tracker:
        raise HTTPException(status_code=404, detail="Job not found in tracker.")

    info = job_state_tracker[job_id_str]
    info["mode"] = mode
    lecture_id = uuid.UUID(info["lectureId"])
    ext = info["extension"]

    cfg = PipelineRunConfig(mode=mode, dsp=dsp, vad=vad, prompt=prompt)
    background_tasks.add_task(run_pipeline_task, job_id, lecture_id, ext, cfg)
    return {
        "status": "ACCEPTED",
        "message": f"Full Stage 1 + Stage 2 pipeline started (mode={mode}, asr=phowhisper-medium, dsp={dsp}, vad={vad})",
    }


@app.post("/api/test-stage2-sample")
async def test_stage2_sample(mode: Literal["real", "mock"] = Query("real")):
    """
    1-click endpoint: generates a 14-segment Vietnamese university lecture transcript
    and executes Stage 2 ([I5] RecursiveTokenChunker + [I6] BgeM3Embedder + ChunkStore) immediately.
    """
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()
    job_id_str = str(job_id)

    incoming_path = audio_store.get_incoming_path(job_id, "wav")
    incoming_path.parent.mkdir(parents=True, exist_ok=True)
    incoming_path.write_bytes(_build_silent_wav_bytes())
    audio_store.register(job_id, lecture_id, "wav")

    segments: list[TranscriptSegment] = []
    curr_sec = 0.0
    step_sec = 28.5
    for idx, text in enumerate(SAMPLE_VIETNAMESE_SEGMENTS):
        start_t = round(curr_sec, 2)
        end_t = round(curr_sec + step_sec, 2)
        segments.append(
            TranscriptSegment(
                id=idx,
                start_time_seconds=start_t,
                end_time_seconds=end_t,
                timestamp_label=format_timestamp_label(start_t),
                text=text,
            )
        )
        curr_sec = end_t

    transcript = TranscriptSchema(
        job_id=job_id,
        lecture_id=lecture_id,
        generated=TranscriptGeneratedMeta(
            model="sample-lecture-generator" if mode == "real" else "mock-sample-generator",
            language="vi",
            device=_resolve_runtime_device() if mode == "real" else "cpu",
            processing_seconds=0.01,
        ),
        audio=TranscriptAudioMeta(
            duration_seconds=round(curr_sec, 2),
            sample_rate_hz=16000,
        ),
        full_text=" ".join(seg.text for seg in segments),
        segments=segments,
    )
    audio_store.save_transcript(job_id, transcript)

    recorder = RunTraceRecorder(
        job_id=job_id_str,
        lecture_id=str(lecture_id),
        mode=mode,
        source="stage2_sample",
    )
    recorder.mark_skipped("register", "Sample transcript.json (14 segments) pre-registered")
    recorder.mark_skipped("normalize", "Skipped (no raw audio)")
    recorder.mark_skipped("asr", "Skipped (using 14-segment Vietnamese sample transcript)")
    recorder.mark_skipped("vram_offload", "Skipped (ASR was not loaded)")

    job_state_tracker[job_id_str] = {
        "jobId": job_id_str,
        "lectureId": str(lecture_id),
        "filename": "sample_vietnamese_lecture_14segs.json",
        "extension": "wav",
        "mode": mode,
        "progress": 75,
        "status": "STT_COMPLETED",
        "message": "Đã tạo transcript.json mẫu. Đang chạy Stage 2...",
        "errorMessage": None,
    }
    job_trace_tracker[job_id_str] = recorder
    _register_recent_job(job_id_str)
    reporter = StateTrackingJobReporter(job_id_str, recorder=recorder)

    if mode == "real":
        text_chunker = get_real_text_chunker()
        embedder = get_real_embedder()
    else:
        text_chunker = RecursiveTokenChunker(
            tokenizer=WhitespaceApproxTokenizer(),
            max_tokens=settings.CHUNK_MAX_TOKENS,
            overlap_tokens=settings.CHUNK_OVERLAP_TOKENS,
        )
        embedder = FakeEmbedder()

    coordinator = IngestPipelineCoordinator(
        audio_store=audio_store,
        preprocessor=FakeAudioPreprocessor(synthetic_duration_seconds=curr_sec),
        asr_engine=FakeAsrEngine(),
        job_reporter=reporter,
        text_chunker=text_chunker,
        embedder=embedder,
        chunk_store=chunk_store,
        low_vram_mode=settings.LOW_VRAM_MODE,
        observer=recorder,
    )

    artifact = await coordinator.run_stage2(job_id, lecture_id=lecture_id, sync_to_db=True)
    manifest = audio_store.resolve_manifest(job_id)
    db_chunks_count = len(chunk_store.get_lecture_chunks(lecture_id))

    return {
        "status": "READY",
        "jobId": job_id_str,
        "lectureId": str(lecture_id),
        "mode": mode,
        "total_segments": len(segments),
        "total_chunks": artifact.total_chunks,
        "db_synced": manifest.chunking.db_synced if manifest else False,
        "db_chunks_count": db_chunks_count,
        "db_backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "processing_seconds": artifact.processing_seconds,
        "trace": recorder.to_dict(),
        "message": f"Hoàn tất Stage 2 ({mode}): {artifact.total_chunks} chunks (<=512 tokens) trong {artifact.processing_seconds}s.",
    }


@app.get("/api/status/{job_id}")
async def get_status(job_id: uuid.UUID):
    job_id_str = str(job_id)
    if job_id_str not in job_state_tracker:
        raise HTTPException(status_code=404, detail="Job not found.")
    payload = dict(job_state_tracker[job_id_str])
    recorder = job_trace_tracker.get(job_id_str)
    if recorder is not None:
        payload["trace"] = recorder.to_dict()
    return payload


@app.get("/api/result/{job_id}")
async def get_result(job_id: uuid.UUID):
    manifest = audio_store.resolve_manifest(job_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Manifest not found.")

    transcript = audio_store.load_transcript(job_id)
    chunks_artifact = audio_store.load_chunks(job_id)

    if chunks_artifact and chunks_artifact.chunks:
        _ensure_lecture_loaded_in_store(manifest.lecture_id)

    db_chunks = chunk_store.get_lecture_chunks(manifest.lecture_id)
    recorder = job_trace_tracker.get(str(job_id))

    return {
        "manifest": manifest.model_dump(mode="json"),
        "transcript": transcript.model_dump(mode="json") if transcript else None,
        "chunks": chunks_artifact.model_dump(mode="json") if chunks_artifact else None,
        "db_chunks_count": len(db_chunks),
        "db_backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "job_state": job_state_tracker.get(str(job_id)),
        "trace": recorder.to_dict() if recorder else None,
    }


class TestSearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lecture_id: uuid.UUID = Field(..., alias="lectureId")
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, alias="topK", ge=1, le=50)
    mode: Literal["real", "mock"] = "real"


@app.post("/api/search")
async def search_hybrid(request: TestSearchRequest):
    """
    Executes 3-stream Vietnamese hybrid RRF search (Dense halfvec + Lexical TSVECTOR + Fuzzy Trigram)
    and returns ranked chunks with latency breakdown and 3-way expanded context.
    """
    t0 = time.perf_counter()
    _ensure_lecture_loaded_in_store(request.lecture_id)

    embedder = get_real_embedder() if request.mode == "real" else _fake_embedder
    loop = asyncio.get_running_loop()

    t_emb = time.perf_counter()
    query_emb = await loop.run_in_executor(None, lambda: embedder.encode_query(request.query))
    embed_ms = round((time.perf_counter() - t_emb) * 1000, 2)

    t_rrf = time.perf_counter()
    raw_hits = chunk_store.search_hybrid_rrf(
        lecture_ids=[request.lecture_id],
        query_embedding=query_emb.dense_halfvec,
        query_text=request.query,
        top_k=request.top_k,
    )
    rrf_ms = round((time.perf_counter() - t_rrf) * 1000, 2)

    t_ctx = time.perf_counter()
    chunk_by_id = {c.id: c for c in chunk_store.get_lecture_chunks(request.lecture_id)}
    enriched_results: list[dict] = []
    for hit in raw_hits:
        cid = hit["chunk_id"]
        ctx = chunk_store.get_expanded_context(cid)
        chunk_obj = chunk_by_id.get(cid)
        enriched_results.append(
            {
                "chunk_id": str(cid),
                "lecture_id": str(hit["lecture_id"]),
                "chunk_index": hit["chunk_index"],
                "start_time_seconds": hit["start_time_seconds"],
                "end_time_seconds": hit["end_time_seconds"],
                "start_timestamp_display": hit["start_timestamp_display"],
                "end_timestamp_display": hit["end_timestamp_display"],
                "speaker_label": hit["speaker_label"],
                "content": hit["content"],
                "token_count": chunk_obj.token_count if chunk_obj else 0,
                "prev_chunk_id": str(hit["prev_chunk_id"]) if hit["prev_chunk_id"] else None,
                "next_chunk_id": str(hit["next_chunk_id"]) if hit["next_chunk_id"] else None,
                "dense_score": hit["dense_score"],
                "lexical_rank": hit["lexical_rank"],
                "fuzzy_rank": hit["fuzzy_rank"],
                "rrf_total_score": hit["rrf_total_score"],
                "lexical_weights": hit.get("lexical_weights", {}),
                "expanded_context": [
                    {
                        "position": item["position"],
                        "chunk_id": str(item["chunk_id"]),
                        "start_timestamp_display": item["start_timestamp_display"],
                        "end_timestamp_display": item["end_timestamp_display"],
                        "speaker_label": item["speaker_label"],
                        "content": item["content"],
                    }
                    for item in ctx
                ],
            }
        )
    context_ms = round((time.perf_counter() - t_ctx) * 1000, 2)
    total_ms = round((time.perf_counter() - t0) * 1000, 2)

    model_used = getattr(embedder, "model_name", "bge-m3" if request.mode == "real" else "fake-embedder")
    device_used = getattr(embedder, "device", "cpu")
    _record_model_run(
        "bge-m3",
        stage="Search [Q2]",
        duration_ms=embed_ms,
        device=device_used,
        engine=type(embedder).__name__,
        mode=request.mode,
    )

    return {
        "lecture_id": str(request.lecture_id),
        "query": request.query,
        "mode": request.mode,
        "model_used": model_used,
        "device": device_used,
        "backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "latency_ms": total_ms,
        "latency_breakdown": {
            "embed_ms": embed_ms,
            "rrf_ms": rrf_ms,
            "context_ms": context_ms,
            "total_ms": total_ms,
        },
        "total_results": len(enriched_results),
        "results": enriched_results,
    }


@app.get("/api/audio/{job_id}")
async def stream_audio(job_id: uuid.UUID):
    normalized_wav = audio_store.get_normalized_path(job_id)
    if normalized_wav.exists():
        return FileResponse(path=str(normalized_wav), media_type="audio/wav")

    for ext in ["wav", "mp3", "m4a", "aac", "flac"]:
        incoming = audio_store.get_incoming_path(job_id, ext)
        if incoming.exists():
            return FileResponse(path=str(incoming), media_type=f"audio/{ext}")

    raise HTTPException(status_code=404, detail="Audio file not found.")


class TestRagQueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lecture_id: uuid.UUID = Field(..., alias="lectureId")
    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, alias="topK", ge=1, le=25)
    retrieval_top_k: int = Field(default=25, alias="retrievalTopK", ge=1, le=50)
    query_system_prompt: str | None = Field(default=None, alias="querySystemPrompt")
    system_prompt: str | None = Field(default=None, alias="systemPrompt")
    prompt_profile: PromptProfile = Field(default="qa_refine", alias="promptProfile")
    response_format: ResponseFormat | None = Field(default=None, alias="responseFormat")
    use_expanded_context: bool = Field(default=True, alias="useExpandedContext")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_new_tokens: int = Field(default=512, alias="maxNewTokens", ge=1, le=4096)
    extra_stages: list[LLMStageConfig] = Field(default_factory=list, alias="extraStages")
    embedder_mode: Literal["real", "mock"] = Field(default="real", alias="embedderMode")
    reranker_mode: Literal["real", "mock"] = Field(default="real", alias="rerankerMode")
    llm_engine: EngineMode = Field(default=_configured_llm_mode, alias="llmEngine")


def _build_rag_flow_trace(
    *,
    request: TestRagQueryRequest,
    response,
    embedder,
    reranker,
) -> tuple[list[dict], list[dict]]:
    tel = response.telemetry
    stages_by_id = {st.stage_id: st for st in response.stage_outputs}
    q1 = stages_by_id.get("q1_query_prep")
    q5 = stages_by_id.get("q5_rag_answer")
    extras = [
        st for st in response.stage_outputs if st.stage_id not in ("q1_query_prep", "q5_rag_answer")
    ]

    emb_device = getattr(embedder, "device", "cpu")
    rr_device = getattr(reranker, "device", "cpu")
    llm_device = _transformers_gemma.device if (q5 and q5.engine == "transformers") else (
        "ollama-http" if (q5 and q5.engine == "ollama") else "cpu"
    )
    offload_note = "LOW_VRAM unload after step" if settings.LOW_VRAM_MODE else "Kept in memory"

    flow_trace = [
        {
            "step_id": "q1_query_prep",
            "code": "Q1",
            "label": "Gemma 4 Query Prep",
            "stage": "Online Pass 1",
            "pipeline": "rag_query",
            "status": "done" if q1 else "skipped",
            "model_used": q1.model if q1 else "—",
            "adapter": f"LLM:{q1.engine}" if q1 else "—",
            "device": llm_device,
            "duration_ms": round(tel.query_prep_ms, 2),
            "in_summary": request.query[:60],
            "out_summary": (response.prepared_query or "")[:60],
            "notes": offload_note,
        },
        {
            "step_id": "q2_embed_rrf",
            "code": "Q2",
            "label": "BGE-M3 + 3-Stream RRF",
            "stage": "Online Retrieval",
            "pipeline": "rag_query",
            "status": "done",
            "model_used": getattr(embedder, "model_name", "bge-m3"),
            "adapter": type(embedder).__name__,
            "device": emb_device,
            "duration_ms": round(tel.embed_ms + tel.retrieval_ms, 2),
            "in_summary": "prepared_query + Drift Guard",
            "out_summary": f"{tel.candidates_retrieved} cands (emb {tel.embed_ms:.1f}ms, rrf {tel.retrieval_ms:.1f}ms)",
            "notes": offload_note,
        },
        {
            "step_id": "q3_expand_ctx",
            "code": "Q3",
            "label": "3-Way Context Expand",
            "stage": "Online Retrieval",
            "pipeline": "rag_query",
            "status": "done" if request.use_expanded_context else "skipped",
            "model_used": None,
            "adapter": type(chunk_store).__name__,
            "device": "pgvector" if chunk_store.is_postgres_connected() else "memory",
            "duration_ms": round(tel.expand_ms, 2),
            "in_summary": f"{tel.candidates_retrieved} chunks",
            "out_summary": "PREVIOUS / CURRENT / NEXT" if request.use_expanded_context else "Disabled",
            "notes": "Doubly-linked prev/next pointers",
        },
        {
            "step_id": "q4_rerank",
            "code": "Q4",
            "label": "BGE-Reranker-v2-m3",
            "stage": "Online Rerank",
            "pipeline": "rag_query",
            "status": "done" if tel.candidates_retrieved > 0 else "skipped",
            "model_used": getattr(reranker, "model_name", "bge-reranker-v2-m3"),
            "adapter": type(reranker).__name__,
            "device": rr_device,
            "duration_ms": round(tel.rerank_ms, 2),
            "in_summary": f"{tel.candidates_retrieved} candidates",
            "out_summary": f"Top {tel.reranked_count} citations",
            "notes": offload_note,
        },
        {
            "step_id": "q5_rag_answer",
            "code": "Q5",
            "label": "Gemma 4 + RAG Synthesis",
            "stage": "Online Pass 2",
            "pipeline": "rag_query",
            "status": "done" if q5 else "skipped",
            "model_used": q5.model if q5 else "—",
            "adapter": f"LLM:{q5.engine}" if q5 else "—",
            "device": llm_device,
            "duration_ms": round(q5.latency_ms, 2) if q5 else 0.0,
            "in_summary": f"{tel.reranked_count} chunks ({request.prompt_profile})",
            "out_summary": f"{len(response.answer)} chars ({q5.response_format if q5 else 'text'})",
            "notes": offload_note if not extras else "Pass to [Q6+]",
        },
        {
            "step_id": "q6_extra_stages",
            "code": "Q6+",
            "label": "Extra Prompt Stages",
            "stage": "Online Extensible",
            "pipeline": "rag_query",
            "status": "done" if extras else "skipped",
            "model_used": extras[-1].model if extras else None,
            "adapter": f"LLM:{extras[-1].engine}" if extras else None,
            "device": llm_device if extras else None,
            "duration_ms": round(sum(e.latency_ms for e in extras), 2),
            "in_summary": f"{len(extras)} stage(s)" if extras else "0 extraStages",
            "out_summary": f"{len(extras[-1].output)} chars" if extras else "Skipped",
            "notes": offload_note if extras else None,
        },
        {
            "step_id": "audit_log",
            "code": "LOG",
            "label": "rag.rag_audit_logs",
            "stage": "Audit",
            "pipeline": "rag_query",
            "status": "done" if response.citations or response.answer else "skipped",
            "model_used": None,
            "adapter": type(telemetry_store).__name__,
            "device": "pgvector" if chunk_store.is_postgres_connected() else "memory",
            "duration_ms": 0.0,
            "in_summary": f"{len(response.citations)} chunk IDs",
            "out_summary": "Audit persisted (No Semantic Cache)",
            "notes": "rag.semantic_query_cache disabled",
        },
    ]

    llm_mode_actual: Literal["real", "mock"] = "mock" if (q5 and q5.engine == "mock") else "real"
    llm_total_ms = round(tel.query_prep_ms + tel.llm_ms, 2)
    models_executed = [
        {
            "model_key": "gemma-4-e2b",
            "adapter": f"Gemma:{q5.engine if q5 else request.llm_engine}",
            "stage": "[Q1/Q5/Q6+] Online LLM",
            "device": llm_device,
            "mode": llm_mode_actual,
            "duration_ms": llm_total_ms,
        },
        {
            "model_key": "bge-m3",
            "adapter": type(embedder).__name__,
            "stage": "[Q2] Query Embed",
            "device": emb_device,
            "mode": request.embedder_mode,
            "duration_ms": round(tel.embed_ms, 2),
        },
        {
            "model_key": "bge-reranker-v2-m3",
            "adapter": type(reranker).__name__,
            "stage": "[Q4] Cross-Encoder",
            "device": rr_device,
            "mode": request.reranker_mode,
            "duration_ms": round(tel.rerank_ms, 2),
        },
    ]

    _record_model_run(
        "gemma-4-e2b",
        stage="RAG [Q1/Q5/Q6+]",
        duration_ms=llm_total_ms,
        device=llm_device,
        engine=q5.engine if q5 else str(request.llm_engine),
        mode=llm_mode_actual,
    )
    _record_model_run(
        "bge-m3",
        stage="RAG [Q2]",
        duration_ms=tel.embed_ms,
        device=emb_device,
        engine=type(embedder).__name__,
        mode=request.embedder_mode,
    )
    _record_model_run(
        "bge-reranker-v2-m3",
        stage="RAG [Q4]",
        duration_ms=tel.rerank_ms,
        device=rr_device,
        engine=type(reranker).__name__,
        mode=request.reranker_mode,
    )

    return flow_trace, models_executed


@app.get("/api/rag/presets")
async def get_rag_presets():
    """Returns built-in Pass 1 ([Q1] query prep) and Pass 2 ([Q5] Gemma 4 + RAG) prompt presets."""
    return _prompt_builder.get_presets()


@app.post("/api/rag/query")
async def execute_test_rag_query(request: TestRagQueryRequest):
    """
    Runs the unified 2-Pass Pre-RAG Gemma 4 pipeline ([Q1]-[Q6+], no Semantic Cache)
    with selectable real/mock adapters for BGE-M3, Reranker, and Gemma 4 E2B.
    """
    _ensure_lecture_loaded_in_store(request.lecture_id)

    embedder = get_real_embedder() if request.embedder_mode == "real" else _fake_embedder
    reranker = get_real_reranker() if request.reranker_mode == "real" else _fake_reranker

    rag_req = RagQueryRequest(
        lecture_ids=[request.lecture_id],
        query=request.query,
        top_k=request.top_k,
        retrieval_top_k=request.retrieval_top_k,
        query_system_prompt=request.query_system_prompt,
        system_prompt=request.system_prompt,
        prompt_profile=request.prompt_profile,
        response_format=request.response_format,
        use_expanded_context=request.use_expanded_context,
        temperature=request.temperature,
        max_new_tokens=request.max_new_tokens,
        extra_stages=request.extra_stages,
    )

    try:
        response = await rag_coordinator.run_query(
            rag_req,
            embedder_override=embedder,
            reranker_override=reranker,
            engine_override=request.llm_engine,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    flow_trace, models_executed = _build_rag_flow_trace(
        request=request,
        response=response,
        embedder=embedder,
        reranker=reranker,
    )

    recent_rag_runs.insert(
        0,
        {
            "query": request.query,
            "lecture_id": str(request.lecture_id),
            "profile": request.prompt_profile,
            "total_ms": response.telemetry.total_ms,
            "models_executed": models_executed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    del recent_rag_runs[20:]

    payload = response.model_dump(mode="json")
    payload["backend"] = "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback"
    payload["adapters"] = {
        "embedder": request.embedder_mode,
        "reranker": request.reranker_mode,
        "llm_engine": request.llm_engine,
    }
    payload["flow_trace"] = flow_trace
    payload["models_executed"] = models_executed
    return payload


@app.get("/api/rag/telemetry")
async def get_rag_telemetry(lecture_id: uuid.UUID | None = Query(None)):
    """Returns RAG Audit Logs (`rag.rag_audit_logs`)."""
    return {
        "backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "audit_logs": telemetry_store.list_audit_logs(lecture_id=lecture_id, limit=50),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8090, reload=True)
