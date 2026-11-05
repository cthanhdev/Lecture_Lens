import { colors, palette, SubjectKey } from './colors';
import { typography, fontFamilies } from './typography';
import { spacing, radius, layout } from './spacing';
import { shadows, blurs } from './elevation';

export const theme = {
  colors,
  palette,
  typography,
  fontFamilies,
  spacing,
  radius,
  layout,
  shadows,
  blurs,
} as const;

export type Theme = typeof theme;
export { colors, palette, typography, fontFamilies, spacing, radius, layout, shadows, blurs };
export type { SubjectKey };
