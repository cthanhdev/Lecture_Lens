"""
LectureLens Test Studio Server
Lightweight FastAPI server running the isolated test UI and driving both
Stage 1 (FFmpeg + PhoWhisper ASR) and Stage 2 ([I5] Chunking + [I6] BGE-M3 + ChunkStore).
Located inside TEST/ folder - completely isolated and safe to delete anytime.
"""
import asyncio
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

# Add backend directory to sys.path to leverage our deep modules
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
from ai_service.core.preprocessing import (
    FakeAudioPreprocessor,
    FFmpegAudioPreprocessor,
    resolve_ffmpeg_binary,
)
from ai_service.core.schemas import (
    TranscriptAudioMeta,
    TranscriptGeneratedMeta,
    TranscriptSchema,
    TranscriptSegment,
)
from ai_service.core.text_chunker import (
    BgeM3TokenizerAdapter,
    RecursiveTokenChunker,
    WhitespaceApproxTokenizer,
)
from ai_service.core.vad_chunker import EnergyVadChunker
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("test_server")

app = FastAPI(title="LectureLens Stage 1 & Stage 2 Test Studio")
settings = get_settings()


def _resolve_storage_root() -> Path:
    env_root = os.getenv("STORAGE_ROOT")
    if env_root:
        return Path(env_root)
    return PROJECT_ROOT / "volumes" / "rag_data"


def _resolve_bge_m3_path() -> Path:
    env_path = os.getenv("MODEL_PATH_BGE_M3")
    if env_path and Path(env_path).exists():
        return Path(env_path)
    return PROJECT_ROOT / "backend" / "models" / "bge-m3"


def _resolve_phowhisper_path(model_variant: str) -> Path:
    if model_variant == "base":
        env_path = os.getenv("MODEL_PATH_PHOWHISPER")
        if env_path and Path(env_path).exists():
            return Path(env_path)
        return PROJECT_ROOT / "backend" / "models" / "phowhisper-base"

    medium_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-medium"
    if medium_path.exists():
        return medium_path
    logger.warning("PhoWhisper-medium not found. Falling back to phowhisper-base.")
    return PROJECT_ROOT / "backend" / "models" / "phowhisper-base"


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


# Configure Storage Root & ChunkStore
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

# Cached lazy-loaded Stage 2 real adapters (shared across sample runs & search)
_real_tokenizer: BgeM3TokenizerAdapter | None = None
_real_embedder: BgeM3Embedder | None = None

# In-memory progress state tracker: job_id -> { ... }
job_state_tracker: dict[str, dict] = {}


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


def _build_silent_wav_bytes(duration_sec: float = 0.25, sample_rate: int = 16000) -> bytes:
    """Builds a minimal valid PCM 16-bit mono WAV payload for sample Stage 2 registration."""
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


# Rich 14-segment Vietnamese university lecture (~1,200 tokens across 4 topics)
# Ensures RecursiveTokenChunker produces multiple <=512-token chunks with 64-token overlap.
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
    """Hydrates InMemoryChunkStore from chunks.json on disk if store is empty (e.g., after reload)."""
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
    """Returns runtime telemetry for FFmpeg, PyTorch, CUDA, PhoWhisper, BGE-M3, and PostgreSQL pgvector."""
    ffmpeg_bin = resolve_ffmpeg_binary()
    ffmpeg_available = Path(ffmpeg_bin).exists() if ffmpeg_bin else False

    torch_installed = False
    cuda_available = False
    device_name = f"CPU ({os.cpu_count() or 1} vCPUs)"
    vram_mb = 0
    try:
        import torch

        torch_installed = True
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
            vram_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
    except ImportError:
        pass

    medium_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-medium"
    base_path = _resolve_phowhisper_path("base")
    bge_m3_path = _resolve_bge_m3_path()

    medium_exists = (medium_path / "pytorch_model.bin").exists() or (medium_path / "model.safetensors").exists()
    base_exists = (base_path / "pytorch_model.bin").exists() or (base_path / "model.safetensors").exists()
    bge_m3_exists = (bge_m3_path / "pytorch_model.bin").exists() or (bge_m3_path / "model.safetensors").exists()
    bge_m3_sparse_exists = (bge_m3_path / "sparse_linear.pt").exists()

    pg_connected = chunk_store.is_postgres_connected()

    return {
        "ffmpeg": {
            "available": ffmpeg_available,
            "binary": ffmpeg_bin,
            "is_bundled": "imageio_ffmpeg" in (ffmpeg_bin or "").lower(),
        },
        "ai_runtime": {
            "torch_installed": torch_installed,
            "cuda_available": cuda_available,
            "device": "cuda" if cuda_available else "cpu",
            "device_name": device_name,
            "vram_mb": vram_mb,
            "low_vram_mode": settings.LOW_VRAM_MODE,
            "omp_num_threads": os.getenv("OMP_NUM_THREADS", "default"),
        },
        "models": {
            "medium_exists": medium_exists,
            "base_exists": base_exists,
            "bge_m3_exists": bge_m3_exists,
            "bge_m3_sparse_linear_exists": bge_m3_sparse_exists,
            "active_default": "PhoWhisper-medium" if medium_exists else "PhoWhisper-base",
            "medium_path": str(medium_path),
            "base_path": str(base_path),
            "bge_m3_path": str(bge_m3_path),
        },
        "database": {
            "postgres_pgvector_connected": pg_connected,
            "backend_mode": "postgres_pgvector" if pg_connected else "in_memory_fallback",
            "host": settings.POSTGRES_HOST,
            "port": settings.POSTGRES_PORT,
            "dbname": settings.POSTGRES_DB,
        },
        "default_prompt": DEFAULT_IT_PROMPT,
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

    ext = Path(file.filename or "audio.wav").suffix.lstrip(".").lower() or "wav"

    incoming_path = audio_store.get_incoming_path(job_id, ext)
    incoming_path.parent.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    incoming_path.write_bytes(content)

    job_state_tracker[str(job_id)] = {
        "jobId": str(job_id),
        "lectureId": str(lecture_id),
        "extension": ext,
        "progress": 5,
        "status": "QUEUED",
        "message": f"Tệp {file.filename} đã tiếp nhận vào incoming volume.",
        "errorMessage": None,
    }

    logger.info("Uploaded test audio for job %s (size: %d bytes)", job_id, len(content))
    return {
        "jobId": str(job_id),
        "lectureId": str(lecture_id),
        "filename": file.filename,
        "sizeBytes": len(content),
    }


class StateTrackingJobReporter:
    """Reporter adapter that updates the in-memory web tracker across all 6 stages."""

    _STAGE_MESSAGES = {
        "PROCESSING_STT": "Đang chuẩn hóa âm thanh & nhận dạng giọng nói PhoWhisper...",
        "STT_COMPLETED": "Đã hoàn tất Stage 1 (transcript.json). Chuẩn bị Stage 2...",
        "CHUNKING": "Đang chạy [I5] RecursiveTokenChunker (<=512 tokens, 64 overlap)...",
        "EMBEDDING": "Đang sinh vector BGE-M3 [I6] halfvec(1024) + lexical_weights...",
        "READY": "Hoàn tất Stage 1 + Stage 2! Đã lưu chunks.json & ChunkStore.",
        "FAILED": "Pipeline gặp sự cố.",
    }

    def __init__(self, job_id_str: str):
        self.job_id_str = job_id_str

    async def report(
        self,
        job_id: uuid.UUID,
        status: str,
        progress: int,
        error_message: str | None = None,
    ) -> bool:
        if self.job_id_str in job_state_tracker:
            job_state_tracker[self.job_id_str]["progress"] = progress
            job_state_tracker[self.job_id_str]["status"] = status
            job_state_tracker[self.job_id_str]["message"] = self._STAGE_MESSAGES.get(status, status)
            if error_message:
                job_state_tracker[self.job_id_str]["errorMessage"] = error_message
        return True


class PipelineRunConfig(BaseModel):
    mode: str = "real"
    model: str = "medium"
    dsp: bool = True
    vad: bool = True
    prompt: str | None = None


async def run_pipeline_task(
    job_id: uuid.UUID,
    lecture_id: uuid.UUID,
    ext: str,
    cfg: PipelineRunConfig,
):
    job_id_str = str(job_id)
    reporter = StateTrackingJobReporter(job_id_str)

    if cfg.mode == "real":
        logger.info(
            "Initializing REAL Full Pipeline for job %s (model=%s, dsp=%s, vad=%s)...",
            job_id,
            cfg.model,
            cfg.dsp,
            cfg.vad,
        )
        preprocessor = FFmpegAudioPreprocessor(enable_dsp_filters=cfg.dsp)
        model_path = _resolve_phowhisper_path(cfg.model)
        device = _resolve_runtime_device()
        vad_chunker = EnergyVadChunker() if cfg.vad else None
        prompt_text = cfg.prompt if cfg.prompt is not None else DEFAULT_IT_PROMPT

        asr_engine = PhoWhisperEngine(
            model_path=model_path,
            device=device,
            vad_chunker=vad_chunker,
            prompt=prompt_text,
        )
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
    )

    await coordinator.run(job_id, lecture_id, ext)


@app.post("/api/process/{job_id}")
async def process_audio(
    job_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    mode: str = Query("real"),
    model: str = Query("medium"),
    dsp: bool = Query(True),
    vad: bool = Query(True),
    prompt: str | None = Query(None),
):
    job_id_str = str(job_id)
    if job_id_str not in job_state_tracker:
        raise HTTPException(status_code=404, detail="Job not found in tracker.")

    info = job_state_tracker[job_id_str]
    lecture_id = uuid.UUID(info["lectureId"])
    ext = info["extension"]

    cfg = PipelineRunConfig(
        mode=mode,
        model=model,
        dsp=dsp,
        vad=vad,
        prompt=prompt,
    )

    background_tasks.add_task(run_pipeline_task, job_id, lecture_id, ext, cfg)
    return {
        "status": "ACCEPTED",
        "message": f"Full Stage 1 + Stage 2 pipeline started (mode={mode}, model={model}, dsp={dsp}, vad={vad})",
    }


@app.post("/api/test-stage2-sample")
async def test_stage2_sample(mode: Literal["real", "mock"] = Query("real")):
    """
    1-click fast endpoint: generates a rich 14-segment Vietnamese university lecture transcript
    (Computer Networks, Active Directory, Linear Algebra, Gradient Descent) and executes
    Stage 2 ([I5] RecursiveTokenChunker + [I6] BgeM3Embedder + ChunkStore) immediately.
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

    job_state_tracker[job_id_str] = {
        "jobId": job_id_str,
        "lectureId": str(lecture_id),
        "extension": "wav",
        "progress": 75,
        "status": "STT_COMPLETED",
        "message": "Đã tạo transcript.json mẫu. Đang chạy Stage 2...",
        "errorMessage": None,
    }
    reporter = StateTrackingJobReporter(job_id_str)

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
        "message": f"Hoàn tất Stage 2 ({mode}): {artifact.total_chunks} chunks (<=512 tokens) trong {artifact.processing_seconds}s.",
    }


@app.get("/api/status/{job_id}")
async def get_status(job_id: uuid.UUID):
    job_id_str = str(job_id)
    if job_id_str not in job_state_tracker:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job_state_tracker[job_id_str]


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

    return {
        "manifest": manifest.model_dump(mode="json"),
        "transcript": transcript.model_dump(mode="json") if transcript else None,
        "chunks": chunks_artifact.model_dump(mode="json") if chunks_artifact else None,
        "db_chunks_count": len(db_chunks),
        "db_backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "job_state": job_state_tracker.get(str(job_id)),
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
    and returns ranked chunks with 3-way expanded context (PREVIOUS / CURRENT / NEXT).
    """
    t0 = time.perf_counter()
    _ensure_lecture_loaded_in_store(request.lecture_id)

    embedder = get_real_embedder() if request.mode == "real" else FakeEmbedder()
    loop = asyncio.get_running_loop()
    query_emb = await loop.run_in_executor(None, lambda: embedder.encode_query(request.query))

    raw_hits = chunk_store.search_hybrid_rrf(
        lecture_ids=[request.lecture_id],
        query_embedding=query_emb.dense_halfvec,
        query_text=request.query,
        top_k=request.top_k,
    )

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

    return {
        "lecture_id": str(request.lecture_id),
        "query": request.query,
        "mode": request.mode,
        "backend": "postgres_pgvector" if chunk_store.is_postgres_connected() else "in_memory_fallback",
        "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8090, reload=True)
