import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, AppColorType } from './colors';
import { AppTypography } from './typography';
import { AppSpacing, AppBorderRadius, AppShadows } from './layout';

type ThemeMode = 'light' | 'dark' | 'system';

export type AppThemeColors = {
  [K in keyof AppColorType]: string;
} & {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  primary: string;
  primaryContainer: string;
  stickyYellowBg: string;
  stickyYellowText: string;
  stickyYellowAccent: string;
  stickyYellowBorder: string;
  stickyPinkBg: string;
  stickyPinkText: string;
  stickyPinkAccent: string;
  stickyPinkBorder: string;
  stickyMintBg: string;
  stickyMintText: string;
  stickyMintAccent: string;
  stickyMintBorder: string;
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: AppThemeColors;
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

  const themeColors: AppThemeColors = {
    ...AppColors,
    background: isDark ? AppColors.darkCanvas : AppColors.canvasCream,
    card: isDark ? AppColors.darkSurfaceCard : AppColors.surfaceCard,
    text: isDark ? AppColors.darkOnSurface : AppColors.onSurface,
    textSecondary: isDark ? AppColors.darkOnSurfaceVariant : AppColors.onSurfaceVariant,
    border: isDark ? AppColors.darkOutline : AppColors.outline,

    surfaceContainerLowest: isDark ? '#181524' : AppColors.surfaceContainerLowest,
    surfaceContainerLow: isDark ? '#231F35' : AppColors.surfaceContainerLow,
    surfaceContainer: isDark ? AppColors.darkSurfaceContainer : AppColors.surfaceContainer,
    surfaceContainerHigh: isDark ? '#3D3759' : AppColors.surfaceContainerHigh,
    surfaceContainerHighest: isDark ? '#464066' : AppColors.surfaceContainerHighest,

    primary: isDark ? AppColors.darkPrimary : AppColors.primary,
    primaryContainer: isDark ? '#6D5FD0' : AppColors.primaryContainer,

    stickyYellowBg: isDark ? '#38321E' : '#FFF9E6',
    stickyYellowText: isDark ? '#FCE69B' : '#5C4813',
    stickyYellowAccent: isDark ? '#FFD45E' : '#A67814',
    stickyYellowBorder: isDark ? '#735E23' : '#D8BA5C',

    stickyPinkBg: isDark ? '#3B202D' : '#FDEEF3',
    stickyPinkText: isDark ? '#FFC4D6' : '#692E44',
    stickyPinkAccent: isDark ? '#FF8FB0' : '#C46D8E',
    stickyPinkBorder: isDark ? '#8A3B58' : '#E79EB7',

    stickyMintBg: isDark ? '#1B332B' : '#E8F8F3',
    stickyMintText: isDark ? '#A7EED8' : '#1F6B58',
    stickyMintAccent: isDark ? '#63E2B7' : '#1F6B58',
    stickyMintBorder: isDark ? '#2D5E4E' : '#9FDAC4',
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
