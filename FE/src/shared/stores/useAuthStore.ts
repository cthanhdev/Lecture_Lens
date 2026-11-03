import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>((set) => ({
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
}));
