import { MaterialCommunityIcons } from '@expo/vector-icons';

export type CategoryVisual = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  border: string;
};

const tint = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const define = (icon: keyof typeof MaterialCommunityIcons.glyphMap, color: string): CategoryVisual => ({
  icon,
  color,
  bg: tint(color, 0.12),
  border: tint(color, 0.26),
});

/** Single source of truth for category icon + color across tiles, pills, and chips. */
export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  barber: define('mustache', '#C97340'), // Warm copper/sunset
  hair: define('scissors-cutting', '#B5922A'), // Logo Gold
  salon: define('hair-dryer', '#C09556'), // Warm amber
  salons: define('hair-dryer', '#C09556'), // Warm amber
  nails: define('hand-back-right-outline', '#B77E8C'), // Dusty rose
  massage: define('hand-heart', '#608066'), // Muted sage green
  spa: define('spa', '#5A8F76'), // Soft eucalyptus
  tattoo: define('brush', '#7D6356'), // Warm cocoa
  facial: define('face-woman-shimmer', '#CBA38E'), // Soft peach
  makeup: define('lipstick', '#AF586A'), // Elegant deep rose
  waxing: define('flower-outline', '#CFA15C'), // Warm honey
  lashes: define('eye-outline', '#5C7C75'), // Slate sage
  piercing: define('needle', '#9E8A75'), // Desert sand/bronze
  default: define('scissors-cutting', '#B5922A'), // Logo Gold
};

export const getCategoryVisual = (key: string | undefined, configuredIcon?: string): CategoryVisual => {
  const base = CATEGORY_VISUALS[(key ?? '').toLowerCase()] ?? CATEGORY_VISUALS.default;
  if (configuredIcon && configuredIcon in MaterialCommunityIcons.glyphMap) {
    return {
      ...base,
      icon: configuredIcon as keyof typeof MaterialCommunityIcons.glyphMap,
    };
  }
  return base;
};
