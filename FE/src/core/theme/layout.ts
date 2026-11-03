export const AppSpacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
  gutter: 16,
  gutterMobile: 12,
  margin: 20,
  marginMobile: 16,
} as const;

export const AppBorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  sticky: 18,
  card: 24,
  input: 20,
  modal: 28,
  pill: 9999,
  full: 9999,
} as const;

export const AppShadows = {
  card: {
    shadowColor: '#6D5FD0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#6D5FD0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  stickyNote: {
    shadowColor: '#5C4813',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  floatingPill: {
    shadowColor: '#6D5FD0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  buttonPrimary: {
    shadowColor: '#5445B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
};
