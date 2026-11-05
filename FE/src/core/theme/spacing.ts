export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const;

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  card: 32,
  pill: 9999,
} as const;

export const layout = {
  screenPadding: spacing.xl, // 20px
  headerTabHeight: 64,
  headerDetailHeight: 56,
  bottomBarHeight: 64,
  fabSize: 56,
} as const;
