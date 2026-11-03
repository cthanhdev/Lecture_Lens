import { create } from 'zustand';
import { NotificationUiModel, MOCK_NOTIFICATIONS } from '../models/notification.types';

interface NotificationState {
  notifications: NotificationUiModel[];
  unreadCount: () => number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

export const selectUnreadCount = (state: NotificationState) =>
  state.notifications.filter((n) => !n.isRead).length;
