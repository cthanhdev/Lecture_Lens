"""
LectureLens Test Studio Server
Lightweight FastAPI server running the test UI and driving the Audio Ingest Pipeline.
Located inside TEST/ folder - completely isolated and safe to delete anytime.
"""
import asyncio
import logging
import os
from pathlib import Path
import sys
import uuid
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile, Query
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

# Add backend directory to sys.path to leverage our deep modules
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ai_service.core.asr import DEFAULT_IT_PROMPT, FakeAsrEngine, PhoWhisperEngine
from ai_service.core.audio_store import LocalVolumeAudioStore
from ai_service.core.preprocessing import (
    FakeAudioPreprocessor,
    FFmpegAudioPreprocessor,
    resolve_ffmpeg_binary,
)
from ai_service.core.vad_chunker import EnergyVadChunker
from ai_service.pipeline.ingest_pipeline import IngestPipelineCoordinator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("test_server")

app = FastAPI(title="LectureLens Audio Ingest Test Lab")

# Configure Storage Root
STORAGE_ROOT = PROJECT_ROOT / "volumes" / "rag_data"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
audio_store = LocalVolumeAudioStore(storage_root=STORAGE_ROOT)

# In-memory progress state tracker: job_id -> { progress: int, status: str, message: str, errorMessage: str }
job_state_tracker: dict[str, dict] = {}


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    template_path = Path(__file__).parent / "templates" / "index.html"
    return HTMLResponse(content=template_path.read_text(encoding="utf-8"))


@app.get("/api/system-diagnostics")
async def get_system_diagnostics():
    """Returns runtime telemetry for FFmpeg, PyTorch, CUDA, and PhoWhisper weights."""
    ffmpeg_bin = resolve_ffmpeg_binary()
    ffmpeg_available = Path(ffmpeg_bin).exists() if ffmpeg_bin else False

    torch_installed = False
    cuda_available = False
    device_name = f"Intel 12th Gen ({os.cpu_count()} vCPUs)"
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
    base_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-base"
    medium_exists = (medium_path / "pytorch_model.bin").exists() or (medium_path / "model.safetensors").exists()
    base_exists = (base_path / "pytorch_model.bin").exists() or (base_path / "model.safetensors").exists()

    return {
        "ffmpeg": {
            "available": ffmpeg_available,
            "binary": ffmpeg_bin,
            "is_bundled": "imageio_ffmpeg" in ffmpeg_bin.lower()
        },
        "ai_runtime": {
            "torch_installed": torch_installed,
            "cuda_available": cuda_available,
            "device": "cuda" if cuda_available else "cpu",
            "device_name": device_name,
            "vram_mb": vram_mb
        },
        "models": {
            "medium_exists": medium_exists,
            "base_exists": base_exists,
            "active_default": "PhoWhisper-medium" if medium_exists else "PhoWhisper-base",
            "medium_path": str(medium_path),
            "base_path": str(base_path)
        },
        "default_prompt": DEFAULT_IT_PROMPT
    }


@app.get("/api/sample-audio")
async def get_sample_audio():
    sample_file = PROJECT_ROOT / "backend" / "tests" / "fixtures" / "sample_lecture_vi.wav"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample audio fixture not found.")
    return FileResponse(
        path=str(sample_file),
        media_type="audio/wav",
        filename="sample_lecture_vi.wav"
    )


@app.post("/api/upload")
async def upload_audio(file: UploadFile = File(...)):
    job_id = uuid.uuid4()
    lecture_id = uuid.uuid4()

    ext = Path(file.filename).suffix.lstrip(".").lower()
    if not ext:
        ext = "wav"

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
        "errorMessage": None
    }

    logger.info("Uploaded test audio for job %s (size: %d bytes)", job_id, len(content))
    return {
        "jobId": str(job_id),
        "lectureId": str(lecture_id),
        "filename": file.filename,
        "sizeBytes": len(content)
    }


class StateTrackingJobReporter:
    """Reporter adapter that updates the in-memory web tracker."""
    def __init__(self, job_id_str: str):
        self.job_id_str = job_id_str

    async def report(self, job_id: uuid.UUID, status: str, progress: int, error_message: str | None = None) -> bool:
        if self.job_id_str in job_state_tracker:
            job_state_tracker[self.job_id_str]["progress"] = progress
            job_state_tracker[self.job_id_str]["status"] = status
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
    cfg: PipelineRunConfig
):
    job_id_str = str(job_id)
    reporter = StateTrackingJobReporter(job_id_str)

    if cfg.mode == "real":
        logger.info(
            "Initializing REAL PhoWhisper Engine for job %s (model=%s, dsp=%s, vad=%s)...",
            job_id, cfg.model, cfg.dsp, cfg.vad
        )
        preprocessor = FFmpegAudioPreprocessor(enable_dsp_filters=cfg.dsp)

        if cfg.model == "base":
            model_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-base"
        else:
            model_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-medium"
            if not model_path.exists():
                logger.warning("PhoWhisper-medium not found. Falling back to phowhisper-base.")
                model_path = PROJECT_ROOT / "backend" / "models" / "phowhisper-base"

        device = "cpu"
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
        except ImportError:
            pass

        vad_chunker = EnergyVadChunker() if cfg.vad else None
        prompt_text = cfg.prompt if cfg.prompt is not None else DEFAULT_IT_PROMPT

        asr_engine = PhoWhisperEngine(
            model_path=model_path,
            device=device,
            vad_chunker=vad_chunker,
            prompt=prompt_text
        )
    else:
        logger.info("Initializing FAST MOCK Engine for job %s...", job_id)
        preprocessor = FakeAudioPreprocessor(synthetic_duration_seconds=12.0)
        asr_engine = FakeAsrEngine(synthetic_segments=[
            "Chào mừng các em sinh viên đến với môn Giải Tích Mạng và Không Gian Vector.",
            "Trong bài học này, chúng ta định nghĩa ma trận trực giao và chuẩn Euclidean.",
            "Hệ vector trực chuẩn đóng vai trò nền tảng trong các giải thuật RAG và Embedding đa chiều.",
            "Bài tập về nhà: chứng minh ma trận xoay hai chiều là một toán tử bảo toàn khoảng cách."
        ])

    coordinator = IngestPipelineCoordinator(
        audio_store=audio_store,
        preprocessor=preprocessor,
        asr_engine=asr_engine,
        job_reporter=reporter
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
    prompt: str | None = Query(None)
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
        prompt=prompt
    )

    background_tasks.add_task(run_pipeline_task, job_id, lecture_id, ext, cfg)
    return {"status": "ACCEPTED", "message": f"Pipeline started with model={model}, dsp={dsp}, vad={vad}"}


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

    transcript_path = STORAGE_ROOT / "transcripts" / str(job_id) / "transcript.json"
    transcript_data = None
    if transcript_path.exists():
        import json
        transcript_data = json.loads(transcript_path.read_text(encoding="utf-8"))

    return {
        "manifest": manifest.model_dump(mode="json"),
        "transcript": transcript_data
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
