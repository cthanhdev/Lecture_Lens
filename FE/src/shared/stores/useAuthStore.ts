import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  email: string;
  school: string;
  avatarInitial: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile;
  connectedAccounts: Record<string, boolean>;
  login: () => void;
  logout: () => void;
  toggleConnectedAccount: (provider: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      user: {
        name: 'Minh Trần',
        email: 'minh.tran@bachkhoa.edu.vn',
        school: 'Kỹ thuật phần mềm • ĐH Bách Khoa',
        avatarInitial: 'M',
      },
      connectedAccounts: {
        Google: true,
        Apple: false,
        Microsoft: false,
        GitHub: false,
      },
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      toggleConnectedAccount: (provider) =>
        set((state) => ({
          connectedAccounts: {
            ...state.connectedAccounts,
            [provider]: !state.connectedAccounts[provider],
          },
        })),
    }),
    {
      name: 'll-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        connectedAccounts: state.connectedAccounts,
      }),
    }
  )
);
