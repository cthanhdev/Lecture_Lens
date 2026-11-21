"""
LectureLens Backend - AI Model Downloader
Tự động tải các pre-trained models về thư mục backend/models/ phục vụ triển khai cục bộ (Local Deployment).
Yêu cầu: pip install huggingface-hub>=2.0.0
"""

import argparse
import os
from pathlib import Path
from huggingface_hub import snapshot_download

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

MODELS = {
    "phowhisper-medium": {
        "repo_id": "vinai/PhoWhisper-medium",
        "local_dir": MODELS_DIR / "phowhisper-medium",
        "description": "PhoWhisper Medium - Speech-to-Text tối ưu tiếng Việt (VinAI)",
    },
    "bge-m3": {
        "repo_id": "BAAI/bge-m3",
        "local_dir": MODELS_DIR / "bge-m3",
        "description": "BGE-M3 - Text Embedding đa ngôn ngữ / đa độ phân giải (BAAI)",
    },
    "bge-reranker-v2-m3": {
        "repo_id": "BAAI/bge-reranker-v2-m3",
        "local_dir": MODELS_DIR / "bge-reranker-v2-m3",
        "description": "BGE Reranker v2 M3 - Cross-Encoder Reranker chấm điểm liên quan (BAAI)",
    },
    "gemma-4-e2b": {
        "repo_id": "google/gemma-4-E2B-it-qat-mobile-transformers",
        "local_dir": MODELS_DIR / "gemma-4-e2b",
        "description": "Gemma 4 E2B QAT Mobile (Transformers INT2/4/8) - Local LLM (Google)",
    },
}


def download_models(
    selected: list[str] | None = None,
    *,
    token: str | None = None,
    force: bool = False,
) -> dict[str, Path]:
    """Downloads selected models into `backend/models/` using huggingface_hub >= 2.x."""
    target_names = selected or list(MODELS.keys())
    resolved_token = token or os.getenv("HF_TOKEN") or None

    print("=" * 60)
    print("🚀 Bắt đầu tải các mô hình AI cho LectureLens Backend")
    print(f"📁 Thư mục lưu trữ: {MODELS_DIR}")
    print("=" * 60)

    downloaded: dict[str, Path] = {}
    for name in target_names:
        if name not in MODELS:
            raise KeyError(f"Unknown model key: {name}")
        info = MODELS[name]
        print(f"\n📦 Đang xử lý [{name}]: {info['description']}...")
        print(f"   Hugging Face Repo: {info['repo_id']}")
        try:
            snapshot_download(
                repo_id=info["repo_id"],
                local_dir=str(info["local_dir"]),
                token=resolved_token,
                force_download=force,
            )
            downloaded[name] = info["local_dir"]
            print(f"   ✅ Tải thành công [{name}] vào {info['local_dir']}")
        except Exception as exc:
            print(f"   ❌ Lỗi khi tải [{name}]: {exc}")
            print("   💡 Gợi ý: Nếu model là gated repo, hãy đăng nhập (`hf auth login`) hoặc truyền `HF_TOKEN`.")

    print("\n" + "=" * 60)
    print("🎉 Hoàn tất quá trình kiểm tra & tải models!")
    print("=" * 60)
    return downloaded


def download_all() -> dict[str, Path]:
    """Backward-compatible helper downloading all configured models."""
    return download_models()


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tải pre-trained AI models cho LectureLens Backend vào backend/models/."
    )
    parser.add_argument(
        "--models",
        nargs="+",
        choices=list(MODELS.keys()),
        default=None,
        help="Danh sách model cần tải (mặc định tải toàn bộ).",
    )
    parser.add_argument(
        "--token",
        default=None,
        help="Hugging Face access token (mặc định tự đọc HF_TOKEN hoặc cache đăng nhập).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Buộc tải lại toàn bộ file kể cả khi đã tồn tại cục bộ.",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = _parse_args()
    download_models(selected=args.models, token=args.token, force=args.force)
