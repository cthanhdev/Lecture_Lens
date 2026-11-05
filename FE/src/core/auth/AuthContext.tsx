import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../domain/types';
import { authRepo } from '../data';
import { tokenStorage } from './tokenStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (fullName: string, email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [savedToken, onboardingDone] = await Promise.all([
          tokenStorage.getToken(),
          tokenStorage.getOnboardingCompleted(),
        ]);

        setHasCompletedOnboarding(onboardingDone);

        if (savedToken) {
          const currentUser = await authRepo.getCurrentUser();
          setUser(currentUser);
          setToken(savedToken);
        }
      } catch {
        // Session restoration failed
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authRepo.login(email, pass);
      setUser(res.user);
      setToken(res.token);
      await tokenStorage.saveToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (fullName: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authRepo.register(fullName, email, pass);
      setUser(res.user);
      setToken(res.token);
      await tokenStorage.saveToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setIsLoading(true);
    try {
      const res = await authRepo.loginAsGuest();
      setUser(res.user);
      setToken(res.token);
      await tokenStorage.saveToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authRepo.logout();
      await tokenStorage.clearToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await tokenStorage.setOnboardingCompleted(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        hasCompletedOnboarding,
        signIn,
        signUp,
        signInAsGuest,
        signOut,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
