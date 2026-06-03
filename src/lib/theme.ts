// Tema de marca Fitnessencial — derivado de web/styles.css
export const colors = {
  bg: '#06080b',
  bg2: '#0b0f14',
  card: '#11161d',
  cardSoft: '#161c25',
  ink: '#f2f6f9',
  inkSoft: '#c4ced6',
  mute: '#7c8995',
  accent: '#2bd4f5', // cian eléctrico del logo
  accent2: '#1391d6',
  accent3: '#0a6ea8',
  accentDim: 'rgba(43, 212, 245, 0.14)',
  line: 'rgba(242, 246, 249, 0.10)',
  lineSoft: 'rgba(242, 246, 249, 0.06)',
  success: '#34d399',
  danger: '#f87171',
  warn: '#fbbf24',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 36,
} as const;

export const font = {
  // Inter es la base; en nativo usamos system, el peso da el carácter.
  display: '800' as const,
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
};

export const logo = require('@/assets/images/logo-circle.webp');
