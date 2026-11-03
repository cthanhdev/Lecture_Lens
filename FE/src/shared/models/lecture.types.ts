export type LectureStatus = 'ready' | 'processing' | 'error';

export interface LectureTopicItem {
  title: string;
  timestamp: string;
  startSeconds: number;
  isCompleted?: boolean;
}

export interface TranscriptSegment {
  timestamp: string;
  startSeconds: number;
  speaker: string;
  content: string;
  isKeyPoint?: boolean;
  stickyNoteText?: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'cu_meo';
  content: string;
  timestamp: string;
  citationTime?: string;
  citationSeconds?: number;
}

export interface LectureUiModel {
  id: string;
  title: string;
  subject: string;
  university?: string;
  status: LectureStatus;
  processingProgress?: number; // 0.0 to 1.0
  processingStatusText?: string;
  remainingTimeText?: string;
  audioFileName?: string;
  audioFileSize?: string;
  durationSeconds?: number;
  topicsCount?: number;
  stickySnippet?: string;
  relativeTime: string;
  resumePositionSeconds?: number;
  tags?: string[];
  isBookmarked?: boolean;
  topics?: LectureTopicItem[];
  transcripts?: TranscriptSegment[];
  aiMessages?: AiChatMessage[];
}

export const MOCK_LECTURES: LectureUiModel[] = [
  {
    id: 'lec_01',
    title: 'Giải Tích 2 — Tích Phân Bội Ba & Ứng Dụng Tọa Độ Cầu',
    subject: 'Giải Tích',
    university: 'ĐH Bách Khoa',
    status: 'ready',
    durationSeconds: 5640, // 1h 34m
    topicsCount: 5,
    relativeTime: '2 giờ trước',
    resumePositionSeconds: 1420,
    stickySnippet: 'Công thức Jacobian đổi biến tọa độ cầu: J = r² sin(φ). Chắc chắn thi cuối kỳ!',
    tags: ['Toán cao cấp', 'Tích phân bội', 'Ôn thi cuối kỳ'],
    isBookmarked: true,
    topics: [
      { title: 'Giới thiệu bài toán thể tích khối tròn xoay', timestamp: '00:00', startSeconds: 0, isCompleted: true },
      { title: 'Định nghĩa tích phân bội ba trong không gian', timestamp: '12:45', startSeconds: 765, isCompleted: true },
      { title: 'Đổi biến sang hệ tọa độ trụ', timestamp: '34:20', startSeconds: 2060, isCompleted: false },
      { title: 'Đổi biến sang hệ tọa độ cầu & Công thức Jacobian', timestamp: '52:15', startSeconds: 3135, isCompleted: false },
      { title: 'Bài tập áp dụng tính thể tích nón cụt', timestamp: '01:18:10', startSeconds: 4690, isCompleted: false },
    ],
    transcripts: [
      {
        timestamp: '12:45',
        startSeconds: 765,
        speaker: 'Thầy Hoàng',
        content: 'Hôm nay chúng ta sang phần trọng tâm của học phần: Tích phân bội ba. Các em lưu ý phương pháp chia nhỏ khối thể tích dV thành dxdydz.',
      },
      {
        timestamp: '52:15',
        startSeconds: 3135,
        speaker: 'Thầy Hoàng',
        content: 'Khi đổi biến sang tọa độ cầu, định thức ma trận Jacobi là J = r bình phương nhân sin phi. Nhớ đừng quên nhân thêm J vào biểu thức tích phân!',
        isKeyPoint: true,
        stickyNoteText: 'J = r² sin(φ) — Luôn nhân kèm khi đổi sang tọa độ cầu!',
      },
      {
        timestamp: '01:05:30',
        startSeconds: 3930,
        speaker: 'Sinh viên',
        content: 'Thầy ơi, góc phi ở đây chạy từ 0 đến pi hay từ 0 đến 2 pi ạ?',
      },
      {
        timestamp: '01:05:45',
        startSeconds: 3945,
        speaker: 'Thầy Hoàng',
        content: 'Câu hỏi rất hay! Góc phi chỉ chạy từ 0 tới pi (từ cực bắc xuống cực nam), còn góc theta mới chạy vòng quanh từ 0 đến 2 pi.',
        isKeyPoint: true,
      },
    ],
    aiMessages: [
      {
        id: 'msg_01',
        sender: 'cu_meo',
        content: 'Chào Minh! Mình đã nghe xong bài giảng Giải Tích 2 của Thầy Hoàng rồi nè. Bạn có thắc mắc gì về tọa độ cầu hay định thức Jacobian không?',
        timestamp: '14:30',
      },
      {
        id: 'msg_02',
        sender: 'user',
        content: 'Công thức tính thể tích bằng tọa độ cầu như thế nào vậy Cú Mèo?',
        timestamp: '14:31',
      },
      {
        id: 'msg_03',
        sender: 'cu_meo',
        content: 'Trong tọa độ cầu, phần tử thể tích dV = r² sin(φ) dr dφ dθ. Thầy Hoàng nhấn mạnh Jacobian J = r² sin(φ) bắt buộc phải nhân vào, nếu thiếu sẽ bị trừ toàn bộ điểm bài đó nhé!',
        timestamp: '14:31',
        citationTime: '52:15',
        citationSeconds: 3135,
      },
    ],
  },
  {
    id: 'lec_02',
    title: 'Kiến Trúc Máy Tính — Bộ Nhớ Cache & Cache Coherence',
    subject: 'Khoa Học Máy Tính',
    university: 'ĐH Bách Khoa',
    status: 'ready',
    durationSeconds: 4320, // 1h 12m
    topicsCount: 4,
    relativeTime: 'Hôm qua',
    resumePositionSeconds: 600,
    stickySnippet: 'Giao thức MESI: Modified, Exclusive, Shared, Invalid.',
    tags: ['MESI', 'Cache L1/L2', 'Hardware'],
    isBookmarked: false,
    topics: [
      { title: 'Nguyên lý cục bộ (Locality of Reference)', timestamp: '00:00', startSeconds: 0, isCompleted: true },
      { title: 'Cấu trúc Direct-mapped vs Set-associative', timestamp: '18:30', startSeconds: 1110, isCompleted: false },
      { title: 'Xung đột Cache & Miss penalty', timestamp: '42:10', startSeconds: 2530, isCompleted: false },
      { title: 'Giao thức nhất quán bộ nhớ đệm MESI', timestamp: '58:00', startSeconds: 3480, isCompleted: false },
    ],
    transcripts: [],
    aiMessages: [],
  },
  {
    id: 'lec_03',
    title: 'Nhập Môn Trí Tuệ Nhân Tạo — Transformer & Self-Attention',
    subject: 'Trí Tuệ Nhân Tạo',
    university: 'ĐH Bách Khoa',
    status: 'processing',
    processingProgress: 0.68,
    processingStatusText: 'Tách chủ đề & lập mục lục thông minh...',
    remainingTimeText: 'Còn khoảng 1 phút 20 giây',
    audioFileName: 'ai_lecture_oct_18.m4a',
    audioFileSize: '48.2 MB',
    relativeTime: '5 phút trước',
    tags: ['Transformer', 'Deep Learning'],
    topics: [],
    transcripts: [],
    aiMessages: [],
  },
];
