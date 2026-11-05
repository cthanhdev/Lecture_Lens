import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lecturelens_auth_token';
const ONBOARDING_KEY = 'lecturelens_onboarding_completed';

export const tokenStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      // In development / test fallbacks
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async clearToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // In development / test fallbacks
    }
  },

  async setOnboardingCompleted(completed = true): Promise<void> {
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, completed ? 'true' : 'false');
    } catch {
      // fallback
    }
  },

  async getOnboardingCompleted(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },
};
