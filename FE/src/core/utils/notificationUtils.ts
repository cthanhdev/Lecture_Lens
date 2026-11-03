import { NotificationUiModel } from '../../shared/models/notification.types';

export const isNotificationToday = (item: NotificationUiModel): boolean => {
  if (!item) return false;
  if (item.createdAt) {
    const itemDate = new Date(item.createdAt);
    if (!isNaN(itemDate.getTime())) {
      const now = new Date();
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getDate() === now.getDate()
      );
    }
  }
  const timeStr = (item.timeAgo || '').toLowerCase();
  return (
    timeStr.includes('phút') ||
    timeStr.includes('giờ') ||
    timeStr.includes('vừa xong') ||
    timeStr.includes('hôm nay')
  );
};
