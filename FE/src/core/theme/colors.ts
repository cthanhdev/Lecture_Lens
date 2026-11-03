/**
 * Bảng màu trung tâm của LectureLens (Japanese Stationery & Kawaii Study Desk)
 * Căn chỉnh chính xác theo DESIGN.md (Pastel Stationery Study Companion)
 */
export const AppColors = {
  // Primary Violet / Lavender
  primary: '#5445B6',
  primaryContainer: '#6D5FD0',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#F7F2FF',
  primaryLight: '#ECE9FB',
  primaryHover: '#4333A4',
  primaryFixed: '#E5DEFF',
  primaryFixedDim: '#C7BFFF',
  onPrimaryFixed: '#180065',
  onPrimaryFixedVariant: '#4333A4',
  inversePrimary: '#C7BFFF',

  // Secondary - Sakura / Plum
  secondary: '#795462',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FECDDD',
  onSecondaryContainer: '#7A5562',
  secondaryFixed: '#FFD9E5',
  secondaryFixedDim: '#E9BACA',
  onSecondaryFixed: '#2E131E',
  onSecondaryFixedVariant: '#5F3D4A',

  // Tertiary - Mint / Forest
  tertiary: '#405C54',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#58756C',
  onTertiaryContainer: '#DAFBEF',
  tertiaryFixed: '#CAE9DF',
  tertiaryFixedDim: '#AECDC3',
  onTertiaryFixed: '#02201A',
  onTertiaryFixedVariant: '#304C44',

  // Background & Surfaces (Giấy viết kem pastel Nhật Bản)
  canvas: '#FDF7FF',
  canvasCream: '#FFFAF5',
  surfaceCard: '#FFFFFF',
  surfaceDim: '#DFD5F8',
  surfaceBright: '#FDF7FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F8F1FF',
  surfaceContainer: '#F2EBFF',
  surfaceContainerHigh: '#EDE4FF',
  surfaceContainerHighest: '#E7DEFF',
  surfaceVariant: '#E7DEFF',

  // Typography & Borders
  onSurface: '#1D1831',
  onSurfaceVariant: '#474553',
  inverseSurface: '#322D47',
  inverseOnSurface: '#F5EEFF',
  outline: '#EDE8F5',
  outlineVariant: '#C9C4D5',
  outlineBorder: '#787584',

  // Stationery Accent Colors (Washi Tape & Sticky Notes)
  sakuraPink: '#F8C8D8',
  sakuraPinkLight: '#FDEEF3',
  onSakuraPink: '#7A5562',

  mintGreen: '#CFEFE4',
  mintGreenDark: '#1F6B58',
  mintGreenLight: '#E8F8F3',

  skyBlue: '#D8E9FB',
  skyBlueDark: '#2D486B',

  butterYellow: '#FFF1C9',
  butterYellowLight: '#FFF9E6',
  butterYellowDark: '#5C4813',
  butterYellowPin: '#A67814',

  // Error & Status
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  softCoral: '#FBD0CC',
  coralDark: '#9B2C2C',

  warning: '#E5A800',
  warningContainer: '#FFF3D0',
  warningDark: '#78590A',
  success: '#1F6B58',

  // Dotted pattern color
  dotColor: '#EADBCE',

  // Dark Mode Tokens
  darkCanvas: '#1E1B2E',
  darkSurfaceCard: '#2A2640',
  darkSurfaceContainer: '#35304F',
  darkPrimary: '#B4A9F5',
  darkOnSurface: '#F1EEFB',
  darkOnSurfaceVariant: '#9E96B8',
  darkOutline: '#383354',
} as const;

export type AppColorType = typeof AppColors;
