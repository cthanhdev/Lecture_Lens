import { TextStyle } from 'react-native';

export const fontFamilies = {
  bold: 'PlusJakartaSans_700Bold',
  semibold: 'PlusJakartaSans_600SemiBold',
  medium: 'PlusJakartaSans_500Medium',
  regular: 'PlusJakartaSans_400Regular',
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.75,
  },
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.55,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.35,
  },
  h3: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.08,
  },
  bodyLg: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySemibold: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.05,
  },
  meta: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.33,
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.25,
  },
  timer: {
    fontFamily: fontFamilies.bold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
} as const;
