"""
LectureLens Backend - AI Model Downloader
Tự động tải các pre-trained models về thư mục models/ phục vụ triển khai cục bộ (Local Deployment).
Yêu cầu: pip install huggingface_hub
"""

import os
from pathlib import Path
from huggingface_hub import snapshot_download

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

MODELS = {
    "phowhisper-base": {
        "repo_id": "vinai/phowhisper-base",
        "local_dir": MODELS_DIR / "phowhisper-base",
        "description": "PhoWhisper Base - Speech-to-Text tối ưu tiếng Việt (VinAI)",
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
    "gemma-4-e4b": {
        "repo_id": "google/gemma-4-E4B-it",
        "local_dir": MODELS_DIR / "gemma-4-e4b",
        "description": "Gemma 4 E4B - Multimodal / Text Generation LLM (Google)",
    },
}

def download_all():
    print("=" * 60)
    print("🚀 Bắt đầu tải các mô hình AI cho LectureLens Backend")
    print(f"📁 Thư mục lưu trữ: {MODELS_DIR}")
    print("=" * 60)

    for name, info in MODELS.items():
        print(f"\n📦 Đang xử lý [{name}]: {info['description']}...")
        print(f"   Hugging Face Repo: {info['repo_id']}")
        try:
            snapshot_download(
                repo_id=info["repo_id"],
                local_dir=str(info["local_dir"]),
                local_dir_use_symlinks=False,
                resume_download=True,
            )
            print(f"   ✅ Tải thành công [{name}] vào {info['local_dir']}")
        except Exception as e:
            print(f"   ❌ Lỗi khi tải [{name}]: {e}")
            print(f"   💡 Gợi ý: Nếu model yêu cầu quyền truy cập (gated repo), hãy đăng nhập: huggingface-cli login")

    print("\n" + "=" * 60)
    print("🎉 Hoàn tất quá trình kiểm tra & tải models!")
    print("=" * 60)

if __name__ == "__main__":
    download_all()

