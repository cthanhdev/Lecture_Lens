import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors } from './colors';
import { AppTypography } from './typography';
import { AppSpacing, AppBorderRadius, AppShadows } from './layout';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof AppColors & {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  typography: typeof AppTypography;
  spacing: typeof AppSpacing;
  borderRadius: typeof AppBorderRadius;
  shadows: typeof AppShadows;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');

  const isDark = mode === 'system' ? systemColorScheme === 'dark' : mode === 'dark';

  const themeColors = {
    ...AppColors,
    background: isDark ? AppColors.darkCanvas : AppColors.canvasCream,
    card: isDark ? AppColors.darkSurfaceCard : AppColors.surfaceCard,
    text: isDark ? AppColors.darkOnSurface : AppColors.onSurface,
    textSecondary: isDark ? AppColors.darkOnSurfaceVariant : AppColors.onSurfaceVariant,
    border: isDark ? AppColors.darkOutline : AppColors.outline,
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        isDark,
        colors: themeColors,
        typography: AppTypography,
        spacing: AppSpacing,
        borderRadius: AppBorderRadius,
        shadows: AppShadows,
        setThemeMode: setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
