import { isNotificationToday } from '../src/core/utils/notificationUtils';
import { filterTranscripts } from '../src/core/utils/transcriptUtils';
import { NotificationUiModel } from '../src/shared/models/notification.types';
import { useAppStore } from '../src/shared/stores/useAppStore';

describe('Sprint 3: Transcript Filtering Logic (filterTranscripts)', () => {
  const transcripts = [
    {
      timestamp: '02:15',
      startSeconds: 135,
      speaker: 'Thầy Hoàng',
      content: 'Hôm nay chúng ta sẽ tìm hiểu về nguyên lý REST API trong thiết kế web service.',
    },
    {
      timestamp: '12:35',
      startSeconds: 755,
      speaker: 'Thầy Hoàng',
      content: 'REST API hoạt động theo kiến trúc Client-Server vô trạng thái (Stateless).',
    },
    {
      timestamp: '24:50',
      startSeconds: 1490,
      speaker: 'Trợ giảng Linh',
      content: 'Chính vì stateless nên chúng ta sử dụng JSON Web Token.',
    },
  ];

  it('returns all transcripts when query is empty or whitespace', () => {
    expect(filterTranscripts(transcripts, '')).toHaveLength(3);
    expect(filterTranscripts(transcripts, '   ')).toHaveLength(3);
  });

  it('filters transcripts by content matching case-insensitively', () => {
    const res = filterTranscripts(transcripts, 'stateless');
    expect(res).toHaveLength(2);
    expect(res[0].timestamp).toBe('12:35');
    expect(res[1].timestamp).toBe('24:50');
  });

  it('filters transcripts by speaker name', () => {
    const res = filterTranscripts(transcripts, 'Trợ giảng Linh');
    expect(res).toHaveLength(1);
    expect(res[0].speaker).toBe('Trợ giảng Linh');
  });

  it('returns empty array when no matches are found', () => {
    const res = filterTranscripts(transcripts, 'Không hề tồn tại');
    expect(res).toHaveLength(0);
  });

  it('handles null, undefined or empty arrays gracefully', () => {
    expect(filterTranscripts(null, 'test')).toEqual([]);
    expect(filterTranscripts(undefined, 'test')).toEqual([]);
    expect(filterTranscripts([], 'test')).toEqual([]);
  });
});

describe('Sprint 3: Notification Date Grouping (isNotificationToday)', () => {
  it('identifies notifications created today by Date/ISO string', () => {
    const todayNotif: NotificationUiModel = {
      id: 'n_1',
      title: 'Bài giảng mới',
      message: 'Đã sẵn sàng',
      timeAgo: '10 phút trước',
      type: 'lecture_ready',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    expect(isNotificationToday(todayNotif)).toBe(true);
  });

  it('identifies notifications created earlier by Date/ISO string', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const earlierNotif: NotificationUiModel = {
      id: 'n_2',
      title: 'Hệ thống',
      message: 'Bảo trì',
      timeAgo: '2 ngày trước',
      type: 'system',
      isRead: true,
      createdAt: twoDaysAgo,
    };
    expect(isNotificationToday(earlierNotif)).toBe(false);
  });

  it('falls back to timeAgo keywords when createdAt is omitted', () => {
    const minAgo: NotificationUiModel = {
      id: 'n_3',
      title: 'Nhắc nhở',
      message: 'Ôn tập',
      timeAgo: '30 phút trước',
      type: 'study_reminder',
      isRead: false,
    };
    expect(isNotificationToday(minAgo)).toBe(true);

    const hoursAgo: NotificationUiModel = {
      id: 'n_4',
      title: 'Nhắc nhở',
      message: 'Ôn tập',
      timeAgo: '3 giờ trước',
      type: 'study_reminder',
      isRead: false,
    };
    expect(isNotificationToday(hoursAgo)).toBe(true);

    const daysAgo: NotificationUiModel = {
      id: 'n_5',
      title: 'Cập nhật',
      message: 'Bản mới',
      timeAgo: '3 ngày trước',
      type: 'system',
      isRead: true,
    };
    expect(isNotificationToday(daysAgo)).toBe(false);
  });

  it('handles null or undefined notifications safely', () => {
    expect(isNotificationToday(null as unknown as NotificationUiModel)).toBe(false);
    expect(isNotificationToday(undefined as unknown as NotificationUiModel)).toBe(false);
  });
});

describe('Sprint 3: Onboarding Initial State', () => {
  it('defaults hasCompletedOnboarding to false for new users', () => {
    useAppStore.setState({ hasCompletedOnboarding: false });
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(false);
  });
});
