import { useNotificationStore, selectUnreadCount } from '../src/shared/stores/useNotificationStore';
import { useAudioPlayerStore } from '../src/shared/stores/useAudioPlayerStore';
import { useAppStore } from '../src/shared/stores/useAppStore';
import { useAuthStore } from '../src/shared/stores/useAuthStore';

describe('useNotificationStore', () => {
  it('counts unread notifications accurately', () => {
    const unread = useNotificationStore.getState().unreadCount();
    expect(unread).toBeGreaterThanOrEqual(1);
    expect(selectUnreadCount(useNotificationStore.getState())).toBe(unread);
  });

  it('marks all notifications as read', () => {
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount()).toBe(0);
    expect(selectUnreadCount(useNotificationStore.getState())).toBe(0);
  });
});

describe('useAudioPlayerStore', () => {
  beforeEach(() => {
    useAudioPlayerStore.setState({
      positionSeconds: 100,
      durationSeconds: 1000,
      isPlaying: false,
      playbackRate: 1.0,
    });
  });

  it('toggles play/pause state', () => {
    expect(useAudioPlayerStore.getState().isPlaying).toBe(false);
    useAudioPlayerStore.getState().togglePlay();
    expect(useAudioPlayerStore.getState().isPlaying).toBe(true);
    useAudioPlayerStore.getState().togglePlay();
    expect(useAudioPlayerStore.getState().isPlaying).toBe(false);
  });

  it('seeks to valid seconds within duration boundaries', () => {
    useAudioPlayerStore.getState().seekTo(500);
    expect(useAudioPlayerStore.getState().positionSeconds).toBe(500);

    useAudioPlayerStore.getState().seekTo(9999);
    expect(useAudioPlayerStore.getState().positionSeconds).toBe(1000); // clamped to duration

    useAudioPlayerStore.getState().seekTo(-50);
    expect(useAudioPlayerStore.getState().positionSeconds).toBe(0); // clamped to 0
  });

  it('skips forward and backward correctly', () => {
    useAudioPlayerStore.getState().seekTo(100);
    useAudioPlayerStore.getState().skipForward(30);
    expect(useAudioPlayerStore.getState().positionSeconds).toBe(130);

    useAudioPlayerStore.getState().skipBackward(20);
    expect(useAudioPlayerStore.getState().positionSeconds).toBe(110);
  });
});

describe('useAppStore', () => {
  it('manages onboarding, app lock and language state', () => {
    useAppStore.setState({
      hasCompletedOnboarding: false,
      appLockEnabled: false,
      selectedLanguage: 'Tiếng Việt',
    });

    useAppStore.getState().completeOnboarding();
    expect(useAppStore.getState().hasCompletedOnboarding).toBe(true);

    useAppStore.getState().toggleAppLock();
    expect(useAppStore.getState().appLockEnabled).toBe(true);
    useAppStore.getState().toggleAppLock();
    expect(useAppStore.getState().appLockEnabled).toBe(false);

    useAppStore.getState().setLanguage('English');
    expect(useAppStore.getState().selectedLanguage).toBe('English');
  });
});

describe('useAuthStore', () => {
  it('handles login, logout and connected accounts', () => {
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    useAuthStore.getState().login();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    const initialApple = !!useAuthStore.getState().connectedAccounts['Apple'];
    useAuthStore.getState().toggleConnectedAccount('Apple');
    expect(useAuthStore.getState().connectedAccounts['Apple']).toBe(!initialApple);
  });
});
