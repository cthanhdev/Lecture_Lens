import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'lecturelens_auth_token';
const ONBOARDING_KEY = 'lecturelens_onboarding_completed';

// In-memory fallback store for Jest/Test and web environments
const inMemoryStore = new Map<string, string>();

export const tokenStorage = {
  async saveToken(token: string): Promise<void> {
    inMemoryStore.set(TOKEN_KEY, token);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      // In development / test fallbacks
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const val = await SecureStore.getItemAsync(TOKEN_KEY);
      if (val !== null && val !== undefined) return val;
    } catch {
      // fallback
    }
    return inMemoryStore.get(TOKEN_KEY) || null;
  },

  async clearToken(): Promise<void> {
    inMemoryStore.delete(TOKEN_KEY);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // In development / test fallbacks
    }
  },

  async setOnboardingCompleted(completed = true): Promise<void> {
    const val = completed ? 'true' : 'false';
    inMemoryStore.set(ONBOARDING_KEY, val);
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, val);
    } catch {
      // fallback
    }
  },

  async getOnboardingCompleted(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (val !== null && val !== undefined) return val === 'true';
    } catch {
      // fallback
    }
    return inMemoryStore.get(ONBOARDING_KEY) === 'true';
  },
};
