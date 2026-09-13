// ==============================================================================
// SAHAKARI SEVA TRADE THEMES — VIBRANT COLOR PALETTES & GRADIENTS
// Gives every cooperative gig category an unmistakable visual identity
// Supporting both light and dark mode with high-contrast accessibility.
// ==============================================================================

export interface TradeTheme {
  primary: string;
  gradient: [string, string];
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
}

export const TRADE_THEMES: Record<string, TradeTheme> = {
  Electrical: {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  Plumbing: {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  Carpentry: {
    primary: '#B86A00',
    gradient: ['#F39A24', '#B86A00'],
    bgLight: '#FFF4DD',
    bgDark: '#3d2503',
    borderLight: '#ffe5b4',
    borderDark: '#78350f',
    badgeBgLight: '#FFF4DD',
    badgeBgDark: '#78350f',
    badgeTextLight: '#92400e',
    badgeTextDark: '#FFF4DD',
  },
  Painting: {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  'Cleaning & Sanitization': {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  'Gardening & Landscaping': {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  'Appliance Repair': {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  'AC Repair & Servicing': {
    primary: '#087F5B',
    gradient: ['#087F5B', '#075C43'],
    bgLight: '#E8F7F1',
    bgDark: '#042f24',
    borderLight: '#c2edd8',
    borderDark: '#075C43',
    badgeBgLight: '#E8F7F1',
    badgeBgDark: '#075C43',
    badgeTextLight: '#075C43',
    badgeTextDark: '#E8F7F1',
  },
  'Driver Services': {
    primary: '#B86A00',
    gradient: ['#F39A24', '#B86A00'],
    bgLight: '#FFF4DD',
    bgDark: '#3d2503',
    borderLight: '#ffe5b4',
    borderDark: '#78350f',
    badgeBgLight: '#FFF4DD',
    badgeBgDark: '#78350f',
    badgeTextLight: '#92400e',
    badgeTextDark: '#FFF4DD',
  },
  'Caregiving & Nursing': {
    primary: '#D92D4F',
    gradient: ['#D92D4F', '#9F1239'],
    bgLight: '#FDECEF',
    bgDark: '#4c0519',
    borderLight: '#fecdd3',
    borderDark: '#9f1239',
    badgeBgLight: '#FDECEF',
    badgeBgDark: '#9f1239',
    badgeTextLight: '#D92D4F',
    badgeTextDark: '#fecdd3',
  },
};

const DEFAULT_TRADE_THEME: TradeTheme = {
  primary: '#087F5B',
  gradient: ['#087F5B', '#075C43'],
  bgLight: '#E8F7F1',
  bgDark: '#042f24',
  borderLight: '#c2edd8',
  borderDark: '#075C43',
  badgeBgLight: '#E8F7F1',
  badgeBgDark: '#075C43',
  badgeTextLight: '#075C43',
  badgeTextDark: '#E8F7F1',
};

export interface ResolvedTradeTheme {
  primary: string;
  gradient: [string, string];
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export function getTradeTheme(tradeName?: string, isDark: boolean = false): ResolvedTradeTheme {
  const matchedKey = tradeName
    ? Object.keys(TRADE_THEMES).find(
        (k) => tradeName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(tradeName.toLowerCase())
      )
    : undefined;
  const theme = matchedKey ? TRADE_THEMES[matchedKey] : DEFAULT_TRADE_THEME;

  return {
    primary: theme.primary,
    gradient: theme.gradient,
    bg: isDark ? theme.bgDark : theme.bgLight,
    border: isDark ? theme.borderDark : theme.borderLight,
    badgeBg: isDark ? theme.badgeBgDark : theme.badgeBgLight,
    badgeText: isDark ? theme.badgeTextDark : theme.badgeTextLight,
  };
}
