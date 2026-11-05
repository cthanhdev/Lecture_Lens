import { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  soft: {
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  hover: {
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  coralGlow: {
    shadowColor: '#F47F72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 8,
  },
  starGlow: {
    shadowColor: '#FFE27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const blurs = {
  soft: 8,
  glass: 16,
  glassStrong: 24,
  ambient: 40,
} as const;
