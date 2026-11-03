import { create } from 'zustand';

interface AppState {
  hasCompletedOnboarding: boolean;
  appLockEnabled: boolean;
  selectedLanguage: string;
  completeOnboarding: () => void;
  toggleAppLock: () => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  hasCompletedOnboarding: true,
  appLockEnabled: false,
  selectedLanguage: 'Tiếng Việt',

  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  toggleAppLock: () => set((state) => ({ appLockEnabled: !state.appLockEnabled })),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
}));
