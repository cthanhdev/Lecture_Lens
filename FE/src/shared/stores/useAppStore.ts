import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  hasCompletedOnboarding: boolean;
  appLockEnabled: boolean;
  selectedLanguage: string;
  completeOnboarding: () => void;
  toggleAppLock: () => void;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: true,
      appLockEnabled: false,
      selectedLanguage: 'Tiếng Việt',

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      toggleAppLock: () => set((state) => ({ appLockEnabled: !state.appLockEnabled })),
      setLanguage: (lang) => set({ selectedLanguage: lang }),
    }),
    {
      name: 'll-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
