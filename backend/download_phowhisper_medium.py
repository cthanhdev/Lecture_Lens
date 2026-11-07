"""
Script to download vinai/PhoWhisper-medium model weights to backend/models/phowhisper-medium.
"""
from pathlib import Path
from huggingface_hub import snapshot_download

BASE_DIR = Path(__file__).resolve().parent
TARGET_DIR = BASE_DIR / "models" / "phowhisper-medium"

def download_phowhisper_medium():
    print(f"Downloading vinai/PhoWhisper-medium into {TARGET_DIR}...")
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    
    snapshot_download(
        repo_id="vinai/PhoWhisper-medium",
        local_dir=str(TARGET_DIR),
        ignore_patterns=["*.msgpack", "*.h5", "*.ot"],
        resume_download=True
    )
    print("Download completed successfully!")

if __name__ == "__main__":
    download_phowhisper_medium()
