export type NotificationType = 'lecture_ready' | 'study_reminder' | 'system';

export interface NotificationUiModel {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: NotificationType;
  isRead: boolean;
  lectureId?: string;
  createdAt?: string;
}

export const MOCK_NOTIFICATIONS: NotificationUiModel[] = [
  {
    id: 'notif_1',
    title: 'Bài giảng đã xử lý xong!',
    message: 'Bài giảng "Giải Tích 2 — Tích Phân Bội Ba" đã sẵn sàng cho bạn ôn tập.',
    timeAgo: '15 phút trước',
    type: 'lecture_ready',
    isRead: false,
    lectureId: 'lec_01',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_2',
    title: 'Cú Mèo gợi ý ôn tập',
    message: 'Đã 2 ngày bạn chưa xem lại công thức Jacobian. Ôn lại ngay nào!',
    timeAgo: '2 giờ trước',
    type: 'study_reminder',
    isRead: false,
    lectureId: 'lec_01',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif_3',
    title: 'Hệ thống cập nhật phiên bản mới',
    message: 'LectureLens vừa ra mắt giao diện bàn học Pastel và linh vật Cú Mèo.',
    timeAgo: '1 ngày trước',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];
