export const palette = {
  // Brand Kitsune Coral
  coral500: '#F47F72', // Primary Brand CTA & Fab
  coral700: '#A03F36', // Deep Coral for pressed states & high contrast
  coral200: '#FFD9DD', // Soft Coral container / highlight
  coral900: '#2F1318', // Deep on-container text

  // Washi & Canvas
  canvas: '#FFF7FC',    // Soft cream washi page backdrop
  surfaceWhite: '#FFFFFF',
  lilac50: '#FCF0FB',
  lilac100: '#F6EAF6',  // Surface Container
  lilac200: '#F0E5F0',  // Surface Container High
  lilac300: '#EADFEA',  // Subtle border / outline variant

  // Inks & Typography
  inkPrimary: '#1F1A21',   // Highest contrast text & titles
  inkSecondary: '#56423F', // Paragraph, descriptions, secondary text
  inkMuted: '#7B5459',     // Tertiary meta & timestamps
  inkSubtle: '#89726F',

  // Deep Plum for shadow layers & dark overlays
  plum: '#261333',
  scrim: 'rgba(38, 19, 51, 0.45)',

  // Accents
  sakuraLight: '#FDCBD1',
  sakuraSoft: 'rgba(253, 203, 209, 0.6)',
  skyLight: '#BEE9FD',
  skyDeep: '#3A6475',
  skyDark: '#001F29',
  mintLight: '#BEE1D0',
  mintDeep: '#0A4325',
  mochiGold: '#FFE27A',   // Star marker, highlight delight
  errorRed: '#BA1A1A',
} as const;

export const colors = {
  bg: {
    canvas: palette.canvas,
    surface: palette.surfaceWhite,
    glass: 'rgba(255, 255, 255, 0.78)',
    glassStrong: 'rgba(255, 255, 255, 0.90)',
    container: palette.lilac100,
    containerHigh: palette.lilac200,
    scrim: palette.scrim,
  },
  text: {
    primary: palette.inkPrimary,
    secondary: palette.inkSecondary,
    muted: palette.inkMuted,
    subtle: palette.inkSubtle,
    onPrimary: '#FFFFFF',
    accent: palette.coral700,
  },
  brand: {
    primary: palette.coral500,
    primaryDeep: palette.coral700,
    primarySoft: palette.coral200,
    onPrimarySoft: palette.coral900,
  },
  border: {
    subtle: palette.lilac300,
    glass: 'rgba(255, 255, 255, 0.6)',
    active: palette.coral500,
  },
  status: {
    ready: { bg: palette.lilac200, text: palette.inkSecondary },
    transcribing: { bg: palette.coral200, text: palette.coral700 },
    live: { bg: palette.coral500, text: '#FFFFFF' },
    due: { bg: palette.coral200, text: palette.coral700 },
    success: { bg: palette.mintLight, text: palette.mintDeep },
    failed: { bg: '#FFDAD6', text: palette.errorRed },
  },
  subjects: {
    macroeconomics: { bg: palette.skyLight, text: palette.skyDark, border: '#7DA7BA' },
    organicChemistry: { bg: palette.lilac100, text: palette.inkSecondary, border: palette.lilac300 },
    cellBiology: { bg: palette.coral200, text: palette.coral700, border: palette.sakuraLight },
    psychology: { bg: palette.sakuraLight, text: '#603D42', border: '#EBBAC0' },
    econ201: { bg: palette.mintLight, text: palette.mintDeep, border: '#A2CDE1' },
    general: { bg: palette.lilac100, text: palette.inkSecondary, border: palette.lilac300 },
  },
} as const;

export type SubjectKey = keyof typeof colors.subjects;
