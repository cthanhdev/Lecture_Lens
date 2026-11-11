// Kitsune Soft Design System Tokens for Mobile (Expo / React Native)
// Theo đặc tả docs/design-system.md và AGENTS.md

export const KITSUNE_COLORS = {
  // Canvas & Ink
  washiCream: '#FFF7FD',       // Giấy Washi nền chính (Ấm áp, chống mỏi mắt)
  plumInk: '#261333',          // Mực mận chín WCAG AAA (Thay cho màu đen thô ráp)
  plumInkMuted: '#56423F',     // Văn bản phụ (85% độ mờ)
  plumInkSubtle: 'rgba(86, 66, 63, 0.50)', // Placeholder / Viền kẻ mờ
  
  // Brand & Accents
  kitsuneCoral: '#F47F72',     // CTA chính, viền focus, active state
  kitsuneCoralDark: '#A03F36', // Viền nhấn & hover/active
  sakuraPink: '#F5C3C9',       // Badge môn học, điểm nhấn linh vật
  mistSky: '#A9D4E8',          // Thanh tiến độ, info bình ổn
  mochiYellow: '#FFE27A',      // Sao yêu thích, Cornell highlight, thành tích
  matchaMint: '#BEE1D0',       // Hoàn thành, Timestamp [MM:SS]
  
  // Miruku Glass Surfaces
  mirukuCard: 'rgba(255, 255, 255, 0.76)',
  mirukuBorder: 'rgba(255, 255, 255, 0.85)',
  plumShadow: 'rgba(38, 19, 51, 0.06)',
} as const

export const KITSUNE_RADII = {
  pill: 9999,       // Nút bấm, ô nhập, chip, badge
  squircleCard: 28, // Thẻ bento chuẩn
  squircleSmall: 20,
  sheetTop: 32,     // Bo góc đỉnh Modal Sheet
} as const

export const KITSUNE_SHADOWS = {
  miruku: {
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  plumModal: {
    shadowColor: '#261333',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
} as const
