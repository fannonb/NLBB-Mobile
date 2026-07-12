export type ThemeMode = 'light' | 'dark';

/** Core brand constants — logo-aligned */
export const Brand = {
  ink: '#080A0E', // Deeper, slightly cool charcoal to make gold pop
  parchment: '#F8F6F0', // Cleaner parchment
  gold: '#B5922A',
  goldLight: '#D4AF37',
  tagline: 'LOOK AND FEEL YOUR BEST',
};

const LIGHT_COLORS = {
  // Backgrounds — warm parchment light theme
  bg: '#FEFCF8',
  card: '#FFFFFF',
  cardInner: '#F5EFE4',

  // Accent — exact NLBB logo gold
  gold: '#B8922A',
  goldLight: '#D4AA1E',
  goldHover: '#C9A430',
  goldDim: 'rgba(184,146,42,0.1)',
  goldBorder: 'rgba(184,146,42,0.26)',

  // Brotherhood ring accents
  brotherhoodRing: 'rgba(184,146,42,0.15)',
  brotherhoodRingDim: 'rgba(184,146,42,0.08)',
  brotherhoodRingStrong: 'rgba(184,146,42,0.25)',

  // Text — warm brown tones
  textPrimary: '#13100A',
  textSecondary: '#5A5040',
  textMuted: '#9A8C78',

  // Status
  success: '#1A9E68',
  error: '#D43030',
  warning: '#D4841A',

  // Border
  border: '#E4DAC8',
  borderLight: 'rgba(0,0,0,0.05)',
  borderMedium: 'rgba(0,0,0,0.10)',

  // Overlay
  overlay: 'rgba(254,252,248,0.95)',
  overlayDark: 'rgba(0,0,0,0.4)',
};

export type ColorPalette = typeof LIGHT_COLORS;

const DARK_COLORS: ColorPalette = {
  bg: Brand.ink,
  card: '#11151C', // Slightly elevated from background
  cardInner: '#1A1F2B',

  gold: '#D4AF37', // Brighter gold for dark mode contrast
  goldLight: '#E2C56B',
  goldHover: '#E8D081',
  goldDim: 'rgba(212,175,55,0.12)',
  goldBorder: 'rgba(212,175,55,0.3)',

  brotherhoodRing: 'rgba(212,175,55,0.15)',
  brotherhoodRingDim: 'rgba(212,175,55,0.08)',
  brotherhoodRingStrong: 'rgba(212,175,55,0.25)',

  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',

  border: '#1F2937',
  borderLight: 'rgba(255,255,255,0.05)',
  borderMedium: 'rgba(255,255,255,0.1)',

  overlay: 'rgba(8,10,14,0.95)',
  overlayDark: 'rgba(0,0,0,0.65)',
};

export const ThemeColors: Record<ThemeMode, ColorPalette> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

export const Colors: ColorPalette = {
  ...LIGHT_COLORS,
};

export const Fonts = {
  serif: 'PlayfairDisplay-Regular',
  serifMedium: 'PlayfairDisplay-Medium',
  serifBold: 'PlayfairDisplay-Bold',
  sans: 'System',
  sansMedium: 'System',
  sansBold: 'System',
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  full: 999,
};

const LIGHT_SHADOW = {
  soft: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  gold: {
    shadowColor: Brand.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
};

export type ShadowPalette = typeof LIGHT_SHADOW;

const DARK_SHADOW: ShadowPalette = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 3,
  },
  gold: {
    shadowColor: '#D0AE4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.34,
    shadowRadius: 10,
    elevation: 6,
  },
};

const ThemeShadows: Record<ThemeMode, ShadowPalette> = {
  light: LIGHT_SHADOW,
  dark: DARK_SHADOW,
};

export const Shadow: ShadowPalette = {
  soft: { ...LIGHT_SHADOW.soft },
  card: { ...LIGHT_SHADOW.card },
  gold: { ...LIGHT_SHADOW.gold },
};

export const applyThemeMode = (mode: ThemeMode) => {
  // Enforce light theme only
  Object.assign(Colors, ThemeColors['light']);

  const nextShadow = ThemeShadows['light'];

  try {
    Shadow.soft = { ...nextShadow.soft };
    Shadow.card = { ...nextShadow.card };
    Shadow.gold = { ...nextShadow.gold };
  } catch {
    // If shadow object graph is frozen, keep current shadows and avoid crashing.
  }
};

export const getThemeColors = (mode: ThemeMode) => ThemeColors[mode];

export const getThemeShadows = (mode: ThemeMode): ShadowPalette => ThemeShadows[mode];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
};
