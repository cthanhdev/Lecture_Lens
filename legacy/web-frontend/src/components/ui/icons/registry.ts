// Registry of all 69 standardized Kitsune Soft vector paths
import type { IconDefinition, IconName, BlobColor } from './types.ts'

export const SOFT_BLOB_PALETTE: Record<BlobColor, string> = {
  sakura: '#F5C3C9',
  mist: '#A9D4E8',
  mochi: '#FFE27A',
  matcha: '#BEE1D0',
  coral: '#F47F72',
  plum: '#261333',
}

// Đường cong hữu cơ Soft-Blob (border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%)
export const ORGANIC_BLOB_PATH = 'M16.8 4.2C19.7 7.1 20.8 11.8 19.4 15.8C18 19.8 14.1 23.1 9.9 22.4C5.7 21.7 1.2 17 0.3 12.3C-0.6 7.6 2.1 2.9 6.3 1C10.5 -0.9 13.9 1.3 16.8 4.2Z'

export const ICON_REGISTRY: Record<IconName, IconDefinition> = {
  "home": {
    "title": "Bàn học (Home)",
    "category": "navigation",
    "blob": "sakura",
    "paths": [
      {
        "d": "M3 10.5L12 3l9 7.5v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"
      },
      {
        "d": "M9 21v-7a3 3 0 0 1 6 0v7"
      }
    ]
  },
  "library": {
    "title": "Kho bài giảng (Library)",
    "category": "navigation",
    "blob": "mist",
    "paths": [
      {
        "d": "M2 6s3-2 8-2 8 2 8 2v13s-3-2-8-2-8 2-8 2V6z"
      },
      {
        "d": "M10 4v13"
      }
    ]
  },
  "subjects": {
    "title": "Môn học (Subjects)",
    "category": "navigation",
    "blob": "mochi",
    "paths": [
      {
        "d": "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
      },
      {
        "d": "M3 10h18"
      }
    ]
  },
  "review": {
    "title": "Ôn tập (Review)",
    "category": "navigation",
    "blob": "matcha",
    "paths": [
      {
        "d": "M7 4h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"
      },
      {
        "d": "M12 2v3"
      },
      {
        "d": "M12 19v3"
      },
      {
        "d": "M2 12h3"
      },
      {
        "d": "M19 12h3"
      },
      {
        "d": "M10 9l4 3-4 3V9z",
        "fill": "currentColor"
      }
    ]
  },
  "profile": {
    "title": "Hồ sơ sinh viên (Profile)",
    "category": "navigation",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
      },
      {
        "d": "M5 21a7 7 0 0 1 14 0"
      }
    ]
  },
  "plus": {
    "title": "Thêm mới (Plus)",
    "category": "navigation",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 5v14"
      },
      {
        "d": "M5 12h14"
      }
    ]
  },
  "arrow-left": {
    "title": "Quay lại (Arrow Left)",
    "category": "navigation",
    "paths": [
      {
        "d": "M19 12H5"
      },
      {
        "d": "M12 19l-7-7 7-7"
      }
    ]
  },
  "arrow-right": {
    "title": "Tiếp tục (Arrow Right)",
    "category": "navigation",
    "paths": [
      {
        "d": "M5 12h14"
      },
      {
        "d": "M12 5l7 7-7 7"
      }
    ]
  },
  "close": {
    "title": "Đóng (Close / X)",
    "category": "navigation",
    "paths": [
      {
        "d": "M18 6L6 18"
      },
      {
        "d": "M6 6l12 12"
      }
    ]
  },
  "more-horizontal": {
    "title": "Tùy chọn ngang (More Horizontal)",
    "category": "navigation",
    "paths": [
      {
        "d": "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      },
      {
        "d": "M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      },
      {
        "d": "M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      }
    ]
  },
  "more-vertical": {
    "title": "Tùy chọn dọc (More Vertical)",
    "category": "navigation",
    "paths": [
      {
        "d": "M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      },
      {
        "d": "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      },
      {
        "d": "M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
        "fill": "currentColor"
      }
    ]
  },
  "search": {
    "title": "Tìm kiếm ngữ nghĩa (Search)",
    "category": "navigation",
    "blob": "mist",
    "paths": [
      {
        "d": "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
      },
      {
        "d": "M21 21l-4.35-4.35"
      }
    ]
  },
  "filter": {
    "title": "Bộ lọc (Filter)",
    "category": "navigation",
    "paths": [
      {
        "d": "M4 6h16"
      },
      {
        "d": "M7 12h10"
      },
      {
        "d": "M10 18h4"
      }
    ]
  },
  "sort": {
    "title": "Sắp xếp (Sort)",
    "category": "navigation",
    "paths": [
      {
        "d": "M7 4v16"
      },
      {
        "d": "M3 8l4-4 4 4"
      },
      {
        "d": "M17 20V4"
      },
      {
        "d": "M13 16l4 4 4-4"
      }
    ]
  },
  "settings": {
    "title": "Cài đặt (Settings)",
    "category": "navigation",
    "blob": "plum",
    "paths": [
      {
        "d": "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      },
      {
        "d": "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      }
    ]
  },
  "bell": {
    "title": "Thông báo (Bell)",
    "category": "navigation",
    "blob": "mochi",
    "paths": [
      {
        "d": "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      },
      {
        "d": "M13.73 21a2 2 0 0 1-3.46 0"
      }
    ]
  },
  "bell-dot": {
    "title": "Thông báo chưa đọc (Bell Dot)",
    "category": "navigation",
    "blob": "coral",
    "paths": [
      {
        "d": "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      },
      {
        "d": "M13.73 21a2 2 0 0 1-3.46 0"
      },
      {
        "d": "M19 4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
        "fill": "#F47F72",
        "stroke": "#FFFFFF",
        "strokeWidth": 1.5
      }
    ]
  },
  "mic": {
    "title": "Thu âm giảng đường (Mic)",
    "category": "audio",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
      },
      {
        "d": "M19 10v2a7 7 0 0 1-14 0v-2"
      },
      {
        "d": "M12 19v3"
      },
      {
        "d": "M8 22h8"
      }
    ]
  },
  "mic-off": {
    "title": "Tắt mic (Mic Off)",
    "category": "audio",
    "paths": [
      {
        "d": "M1 1l22 22"
      },
      {
        "d": "M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"
      },
      {
        "d": "M19 10v2a7 7 0 0 1-.58 2.81"
      },
      {
        "d": "M5 10v2a7 7 0 0 0 8.8 6.77"
      },
      {
        "d": "M12 19v3"
      },
      {
        "d": "M8 22h8"
      }
    ]
  },
  "upload": {
    "title": "Tải tệp âm thanh (Upload)",
    "category": "audio",
    "blob": "mist",
    "paths": [
      {
        "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      },
      {
        "d": "M17 8l-5-5-5 5"
      },
      {
        "d": "M12 3v12"
      }
    ]
  },
  "cloud-upload": {
    "title": "Tải lên đám mây (Cloud Upload)",
    "category": "audio",
    "blob": "mist",
    "paths": [
      {
        "d": "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"
      },
      {
        "d": "M12 13l3-3 3 3"
      },
      {
        "d": "M15 10v6"
      }
    ]
  },
  "link": {
    "title": "Dán liên kết (Link)",
    "category": "audio",
    "blob": "mochi",
    "paths": [
      {
        "d": "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      },
      {
        "d": "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      }
    ]
  },
  "waveform": {
    "title": "Ghi âm Voice Memos (Waveform)",
    "category": "audio",
    "blob": "matcha",
    "paths": [
      {
        "d": "M4 10v4"
      },
      {
        "d": "M8 7v10"
      },
      {
        "d": "M12 3v18"
      },
      {
        "d": "M16 6v12"
      },
      {
        "d": "M20 9v6"
      }
    ]
  },
  "play": {
    "title": "Phát âm thanh (Play)",
    "category": "audio",
    "paths": [
      {
        "d": "M6 4.5l14 7.5-14 7.5v-15z",
        "fill": "currentColor"
      }
    ]
  },
  "pause": {
    "title": "Tạm dừng (Pause)",
    "category": "audio",
    "paths": [
      {
        "d": "M6 4h4v16H6z",
        "fill": "currentColor"
      },
      {
        "d": "M14 4h4v16h-4z",
        "fill": "currentColor"
      }
    ]
  },
  "stop": {
    "title": "Dừng ghi âm (Stop)",
    "category": "audio",
    "paths": [
      {
        "d": "M6 6h12v12H6z",
        "fill": "currentColor"
      }
    ]
  },
  "replay-10": {
    "title": "Tua lại 10s (Replay 10s)",
    "category": "audio",
    "paths": [
      {
        "d": "M3 10h5V5"
      },
      {
        "d": "M3.5 10a9 9 0 1 1 1.7 8.3"
      },
      {
        "d": "M10 12v4"
      },
      {
        "d": "M14 12v4a1.5 1.5 0 0 0 3 0v-4a1.5 1.5 0 0 0-3 0z"
      }
    ]
  },
  "forward-10": {
    "title": "Tua tới 10s (Forward 10s)",
    "category": "audio",
    "paths": [
      {
        "d": "M21 10h-5V5"
      },
      {
        "d": "M20.5 10a9 9 0 1 0-1.7 8.3"
      },
      {
        "d": "M9 12v4"
      },
      {
        "d": "M13 12v4a1.5 1.5 0 0 0 3 0v-4a1.5 1.5 0 0 0-3 0z"
      }
    ]
  },
  "headphones": {
    "title": "Tai nghe bài giảng (Headphones)",
    "category": "audio",
    "blob": "sakura",
    "paths": [
      {
        "d": "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
      }
    ]
  },
  "speaker": {
    "title": "Loa trích đoạn (Speaker)",
    "category": "audio",
    "paths": [
      {
        "d": "M11 5L6 9H2v6h4l5 4V5z"
      },
      {
        "d": "M15.54 8.46a5 5 0 0 1 0 7.07"
      },
      {
        "d": "M19.07 4.93a10 10 0 0 1 0 14.14"
      }
    ]
  },
  "speed": {
    "title": "Tốc độ phát (Speed Gauge)",
    "category": "audio",
    "paths": [
      {
        "d": "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"
      },
      {
        "d": "M12 6v6l4 2"
      }
    ]
  },
  "snippet-play": {
    "title": "Nghe trích đoạn gốc (Snippet Play)",
    "category": "audio",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"
      },
      {
        "d": "M10 8l6 4-6 4V8z",
        "fill": "currentColor"
      }
    ]
  },
  "sparkles": {
    "title": "Trợ lý AI Kitsune (Sparkles)",
    "category": "ai",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z",
        "fill": "#F47F72"
      },
      {
        "d": "M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z",
        "fill": "#FFE27A"
      },
      {
        "d": "M5 17l.8 1.6L7.4 19l-1.6.8L5 21.4l-.8-1.6L2.6 19l1.6-.8L5 17z",
        "fill": "#A9D4E8"
      }
    ]
  },
  "file-text": {
    "title": "Tóm tắt Cornell Notes (File Text)",
    "category": "study",
    "blob": "mochi",
    "paths": [
      {
        "d": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      },
      {
        "d": "M14 2v6h6"
      },
      {
        "d": "M8 13h8"
      },
      {
        "d": "M8 17h6"
      }
    ]
  },
  "clock": {
    "title": "Mốc thời gian [MM:SS] (Clock)",
    "category": "study",
    "blob": "matcha",
    "paths": [
      {
        "d": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      },
      {
        "d": "M12 6v6l4 2"
      }
    ]
  },
  "star": {
    "title": "Đánh dấu điểm nhấn (Star)",
    "category": "study",
    "blob": "mochi",
    "paths": [
      {
        "d": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        "fill": "#FFE27A"
      }
    ]
  },
  "bookmark": {
    "title": "Đánh dấu phân đoạn (Bookmark)",
    "category": "study",
    "blob": "sakura",
    "paths": [
      {
        "d": "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      }
    ]
  },
  "highlighter": {
    "title": "Trích xuất điểm nhấn (Highlighter)",
    "category": "study",
    "blob": "mochi",
    "paths": [
      {
        "d": "M9 11l-6 6v3h3l6-6"
      },
      {
        "d": "M13.5 6.5l4 4"
      },
      {
        "d": "M17.5 2.5a2.121 2.121 0 0 1 3 3l-9.5 9.5-4-4 9.5-9.5z"
      }
    ]
  },
  "flame": {
    "title": "Chuỗi streak & Cảnh báo đề thi (Flame)",
    "category": "study",
    "blob": "coral",
    "paths": [
      {
        "d": "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
        "fill": "#F47F72"
      }
    ]
  },
  "help-circle": {
    "title": "Câu hỏi gợi nhớ Cues (Help Circle)",
    "category": "study",
    "blob": "mist",
    "paths": [
      {
        "d": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      },
      {
        "d": "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
      },
      {
        "d": "M12 17h.01"
      }
    ]
  },
  "list-tree": {
    "title": "Cây mục lục chương (List Tree)",
    "category": "study",
    "paths": [
      {
        "d": "M21 12h-8"
      },
      {
        "d": "M21 6H8"
      },
      {
        "d": "M21 18h-8"
      },
      {
        "d": "M3 6v12a2 2 0 0 0 2 2h3"
      },
      {
        "d": "M3 12h5"
      }
    ]
  },
  "download": {
    "title": "Tải vào bộ nhớ máy Vault (Download)",
    "category": "study",
    "blob": "matcha",
    "paths": [
      {
        "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      },
      {
        "d": "M7 10l5 5 5-5"
      },
      {
        "d": "M12 15V3"
      }
    ]
  },
  "share": {
    "title": "Xuất & Chia sẻ (Share)",
    "category": "study",
    "paths": [
      {
        "d": "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      },
      {
        "d": "M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      },
      {
        "d": "M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      },
      {
        "d": "M8.59 13.51l6.83 3.98"
      },
      {
        "d": "M15.41 6.51l-6.82 3.98"
      }
    ]
  },
  "copy": {
    "title": "Sao chép văn bản (Copy)",
    "category": "study",
    "paths": [
      {
        "d": "M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z"
      },
      {
        "d": "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      }
    ]
  },
  "robot-ai": {
    "title": "Trợ lý Neural RAG (Robot AI)",
    "category": "ai",
    "blob": "coral",
    "paths": [
      {
        "d": "M12 2v3"
      },
      {
        "d": "M4 8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8z"
      },
      {
        "d": "M9 11h.01"
      },
      {
        "d": "M15 11h.01"
      },
      {
        "d": "M9 15h6"
      },
      {
        "d": "M2 13h2"
      },
      {
        "d": "M20 13h2"
      }
    ]
  },
  "cards": {
    "title": "Thẻ ghi nhớ Flashcards (Cards)",
    "category": "review",
    "blob": "sakura",
    "paths": [
      {
        "d": "M7 4h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      },
      {
        "d": "M3 8v10a2 2 0 0 0 2 2h11"
      }
    ]
  },
  "flip": {
    "title": "Lật thẻ 3D (Flip Card)",
    "category": "review",
    "blob": "mochi",
    "paths": [
      {
        "d": "M3 12a9 9 0 0 1 15-6.7L21 8"
      },
      {
        "d": "M21 3v5h-5"
      },
      {
        "d": "M21 12a9 9 0 0 1-15 6.7L3 16"
      },
      {
        "d": "M3 21v-5h5"
      }
    ]
  },
  "lightbulb": {
    "title": "Gợi ý đáp án (Lightbulb)",
    "category": "review",
    "blob": "mochi",
    "paths": [
      {
        "d": "M9 18h6"
      },
      {
        "d": "M10 22h4"
      },
      {
        "d": "M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .5 2.5 1.5 3.5.76.76 1.23 1.52 1.41 2.5h6.18z"
      }
    ]
  },
  "trophy": {
    "title": "Vinh danh hoàn thành (Trophy)",
    "category": "review",
    "blob": "mochi",
    "paths": [
      {
        "d": "M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"
      },
      {
        "d": "M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"
      },
      {
        "d": "M6 3h12v7a6 6 0 0 1-12 0V3z"
      },
      {
        "d": "M12 16v3"
      },
      {
        "d": "M8 22h8"
      }
    ]
  },
  "party-popper": {
    "title": "Chúc mừng thành tích (Party Popper)",
    "category": "review",
    "blob": "sakura",
    "paths": [
      {
        "d": "M5.8 11.3L2 22l10.7-3.8L5.8 11.3z"
      },
      {
        "d": "M4 3h.01"
      },
      {
        "d": "M22 6h.01"
      },
      {
        "d": "M15 2h.01"
      },
      {
        "d": "M22 20h.01"
      },
      {
        "d": "M11 6a4 4 0 0 0 4-4"
      },
      {
        "d": "M16 11a4 4 0 0 0 4-4"
      }
    ]
  },
  "brain": {
    "title": "Ghi nhớ ngắt quãng (Brain)",
    "category": "review",
    "blob": "mist",
    "paths": [
      {
        "d": "M9.5 2A4.5 4.5 0 0 0 5 6.5c0 .41.05.81.16 1.19A4.5 4.5 0 0 0 3 11.5c0 2.08 1.41 3.82 3.33 4.33A4.5 4.5 0 0 0 10.5 20c.41 0 .81-.05 1.19-.16"
      },
      {
        "d": "M14.5 2A4.5 4.5 0 0 1 19 6.5c0 .41-.05.81-.16 1.19A4.5 4.5 0 0 1 21 11.5c0 2.08-1.41 3.82-3.33 4.33A4.5 4.5 0 0 1 13.5 20c-.41 0-.81-.05-1.19-.16"
      },
      {
        "d": "M12 2v18"
      }
    ]
  },
  "rating-again": {
    "title": "Đánh giá Quên hẳn (Rating Again)",
    "category": "review",
    "paths": [
      {
        "d": "M1 4v6h6"
      },
      {
        "d": "M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
      }
    ]
  },
  "rating-hard": {
    "title": "Đánh giá Khó nhớ (Rating Hard)",
    "category": "review",
    "paths": [
      {
        "d": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      },
      {
        "d": "M8 15h8"
      },
      {
        "d": "M9 9h.01"
      },
      {
        "d": "M15 9h.01"
      }
    ]
  },
  "rating-good": {
    "title": "Đánh giá Nhớ tốt (Rating Good)",
    "category": "review",
    "paths": [
      {
        "d": "M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
      }
    ]
  },
  "rating-easy": {
    "title": "Đánh giá Dễ ợt (Rating Easy)",
    "category": "review",
    "paths": [
      {
        "d": "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
        "fill": "#BEE1D0"
      }
    ]
  },
  "kitsune-fox": {
    "title": "Linh vật Cáo Kitsune (Kitsune Fox)",
    "category": "mascot",
    "blob": "coral",
    "paths": [
      {
        "d": "M4 8l3-6 4 4 1-2 1 2 4-4 3 6-2 10a8 8 0 0 1-14 0L4 8z",
        "fill": "#FFFFFF"
      },
      {
        "d": "M4 8l3-6 2 2-3 4-2 0z",
        "fill": "#F47F72"
      },
      {
        "d": "M20 8l-3-6-2 2 3 4 2 0z",
        "fill": "#F47F72"
      },
      {
        "d": "M11 15h2l-1 1-1-1z",
        "fill": "#261333"
      },
      {
        "d": "M8 12h.01"
      },
      {
        "d": "M16 12h.01"
      }
    ]
  },
  "crown": {
    "title": "Vương miện Kitsune Plus (Crown)",
    "category": "system",
    "blob": "mochi",
    "paths": [
      {
        "d": "M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z",
        "fill": "#FFE27A"
      },
      {
        "d": "M5 20h14"
      }
    ]
  },
  "check": {
    "title": "Dấu tích (Check)",
    "category": "system",
    "paths": [
      {
        "d": "M20 6L9 17l-5-5"
      }
    ]
  },
  "check-circle": {
    "title": "Hoàn thành (Check Circle)",
    "category": "system",
    "blob": "matcha",
    "paths": [
      {
        "d": "M22 11.08V12a10 10 0 1 1-5.93-9.14"
      },
      {
        "d": "M22 4L12 14.01l-3-3"
      }
    ]
  },
  "check-double": {
    "title": "Đã xử lý (Check Double)",
    "category": "system",
    "paths": [
      {
        "d": "M18 6L7 17l-5-5"
      },
      {
        "d": "M22 10l-7.5 7.5-1.5-1.5"
      }
    ]
  },
  "wifi-off": {
    "title": "Ngoại tuyến (Wifi Off)",
    "category": "system",
    "paths": [
      {
        "d": "M1 1l22 22"
      },
      {
        "d": "M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
      },
      {
        "d": "M5 12.55a10.94 10.94 0 0 1 5.17-2.39"
      },
      {
        "d": "M10.71 5.05A16 16 0 0 1 22.58 9"
      },
      {
        "d": "M1.42 9a15.91 15.91 0 0 1 4.7-2.88"
      },
      {
        "d": "M8.53 16.11a6 6 0 0 1 6.95 0"
      },
      {
        "d": "M12 20h.01"
      }
    ]
  },
  "lock": {
    "title": "Khóa bảo mật On-Premise (Lock)",
    "category": "system",
    "blob": "plum",
    "paths": [
      {
        "d": "M7 11V7a5 5 0 0 1 10 0v4"
      },
      {
        "d": "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
      },
      {
        "d": "M12 15v3"
      }
    ]
  },
  "lock-check": {
    "title": "Khóa an toàn (Lock Check)",
    "category": "system",
    "blob": "matcha",
    "paths": [
      {
        "d": "M7 11V7a5 5 0 0 1 10 0v4"
      },
      {
        "d": "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
      },
      {
        "d": "M10 16l1.5 1.5 3-3"
      }
    ]
  },
  "eye": {
    "title": "Hiện mật khẩu (Eye)",
    "category": "system",
    "paths": [
      {
        "d": "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      },
      {
        "d": "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      }
    ]
  },
  "eye-off": {
    "title": "Ẩn mật khẩu (Eye Off)",
    "category": "system",
    "paths": [
      {
        "d": "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      },
      {
        "d": "M1 1l22 22"
      }
    ]
  },
  "mail": {
    "title": "Email sinh viên (Mail)",
    "category": "system",
    "blob": "mist",
    "paths": [
      {
        "d": "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      },
      {
        "d": "M22 6l-10 7L2 6"
      }
    ]
  },
  "pencil": {
    "title": "Chỉnh sửa ghi chú (Pencil)",
    "category": "system",
    "paths": [
      {
        "d": "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      }
    ]
  },
  "trash": {
    "title": "Xóa bài giảng (Trash)",
    "category": "system",
    "paths": [
      {
        "d": "M3 6h18"
      },
      {
        "d": "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      }
    ]
  },
  "refresh": {
    "title": "Đồng bộ & Thử lại (Refresh)",
    "category": "system",
    "paths": [
      {
        "d": "M23 4v6h-6"
      },
      {
        "d": "M1 20v-6h6"
      },
      {
        "d": "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
      }
    ]
  },
  "chevron-down": {
    "title": "Mở rộng (Chevron Down)",
    "category": "navigation",
    "paths": [
      {
        "d": "M6 9l6 6 6-6"
      }
    ]
  },
  "chevron-up": {
    "title": "Thu gọn (Chevron Up)",
    "category": "navigation",
    "paths": [
      {
        "d": "M18 15l-6-6-6 6"
      }
    ]
  },
  "chevron-right": {
    "title": "Điều hướng mục (Chevron Right)",
    "category": "navigation",
    "paths": [
      {
        "d": "M9 18l6-6-6-6"
      }
    ]
  },
  "google": {
    "title": "Đăng nhập Google (Google)",
    "category": "system",
    "paths": [
      {
        "d": "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
        "fill": "#4285F4"
      },
      {
        "d": "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
        "fill": "#34A853"
      },
      {
        "d": "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z",
        "fill": "#FBBC05"
      },
      {
        "d": "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z",
        "fill": "#EA4335"
      }
    ]
  },
  "apple": {
    "title": "Đăng nhập Apple (Apple)",
    "category": "system",
    "paths": [
      {
        "d": "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.03.62-2.68 1.38-.56.65-.99 1.68-.87 2.7.99.08 2.01-.46 2.63-1.21z",
        "fill": "currentColor"
      }
    ]
  }
};
