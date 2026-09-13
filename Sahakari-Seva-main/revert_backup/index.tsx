// mobile/src/theme/index.ts
// ==============================================================================
// SAHAKARI SEVA UNIFIED DESIGN SYSTEM TOKENS — LIGHT & DARK THEMES
// ==============================================================================
// REVERSIBILITY NOTICE:
// To instantly revert back to the original theme across the entire application,
// simply change DEFAULT_THEME_PRESET from 'modern' to 'classic' below!
// ==============================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// -----------------------------------------------------------------------------
// PALETTE INTERFACE
// -----------------------------------------------------------------------------

export interface Palette {
  primary: string;
  primaryLight: string;
  primaryDark: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;

  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderFocus: string;

  topPanel: string;
  topPanelBorder: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  danger: string;
  dangerLight: string;
  dangerDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
  violet: string;
  violetLight: string;
  violetDark: string;

  star: string;
}

// -----------------------------------------------------------------------------
// 1. MODERN SAHAKARI PALETTES (Matches the Glowing Login Screen Aesthetic)
// Palette: "Cooperative Emerald & Slate Canvas" (light) / "Midnight Abyss & Neon Cyan" (dark)
// -----------------------------------------------------------------------------

export const modernLightColors: Palette = {
  primary: '#10b981',        // Cooperative Emerald
  primaryLight: '#ecfdf5',   // Soft emerald mint tint
  primaryDark: '#047857',    // Deep forest emerald

  secondary: '#f59e0b',      // Radiant Amber / Saffron
  secondaryLight: '#fef3c7', // Soft amber tint
  secondaryDark: '#b45309',  // Deep amber gold

  background: '#f8fafc',     // Clean slate canvas (matches login screen)
  surface: '#ffffff',        // Pure crisp white cards
  surfaceSubtle: '#f1f5f9',  // Elevated slate-100 containers
  border: '#e2e8f0',         // Crisp modern slate dividers
  borderFocus: '#10b981',    // Emerald focus ring
  topPanel: '#ffffff',       // Crisp white top header
  topPanelBorder: '#e2e8f0', // Clean divider

  textPrimary: '#0f172a',    // High-contrast slate-900 ink
  textSecondary: '#475569',  // Slate-600 body text
  textMuted: '#94a3b8',      // Slate-400 captions
  textInverse: '#ffffff',    // White on dark buttons

  success: '#10b981',        // Emerald
  successLight: '#d1fae5',
  successDark: '#065f46',
  warning: '#f59e0b',        // Amber
  warningLight: '#fef3c7',
  warningDark: '#92400e',
  danger: '#e11d48',         // Rose / Coral
  dangerLight: '#ffe4e6',
  dangerDark: '#9f1239',
  info: '#0d9488',           // Architectural Teal
  infoLight: '#ccfbf1',
  infoDark: '#0f766e',
  violet: '#8b5cf6',         // Modern violet
  violetLight: '#ede9fe',
  violetDark: '#6d28d9',

  star: '#f59e0b',
};

export const modernDarkColors: Palette = {
  primary: '#10b981',        // Emerald Green (matching login CTA)
  primaryLight: 'rgba(16, 185, 129, 0.18)', // Translucent emerald fill
  primaryDark: '#34d399',    // Luminous mint text-on-fill

  secondary: '#fbbf24',      // Warm Champagne Amber
  secondaryLight: '#451a03', // Deep amber fill
  secondaryDark: '#fde68a',  // Pale gold text-on-fill

  background: '#040712',     // Deep midnight abyss (matches login screen)
  surface: '#0c172e',        // Midnight slate card surface
  surfaceSubtle: '#131f3b',  // Raised container
  border: 'rgba(255, 255, 255, 0.10)', // Delicate border
  borderFocus: '#2dd4bf',    // Neon cyan glow
  topPanel: '#071024',       // Deep midnight header
  topPanelBorder: '#1e293b', // Muted dark divider

  textPrimary: '#f8fafc',    // Crisp moonlight slate-50
  textSecondary: '#94a3b8',  // Soft slate
  textMuted: '#64748b',      // Dim captions
  textInverse: '#040712',    // Deep dark text on bright buttons

  success: '#34d399',        // Luminous emerald
  successLight: '#064e3b',
  successDark: '#6ee7b7',
  warning: '#fbbf24',        // Amber
  warningLight: '#451a03',
  warningDark: '#fcd34d',
  danger: '#fb7185',         // Coral rose
  dangerLight: '#4c0519',
  dangerDark: '#fda4af',
  info: '#2dd4bf',           // Neon Cyan / Teal
  infoLight: '#042f2e',
  infoDark: '#5eead4',
  violet: '#a78bfa',
  violetLight: '#2e1065',
  violetDark: '#c4b5fd',

  star: '#fbbf24',
};

// -----------------------------------------------------------------------------
// 2. CLASSIC PALETTES (Untouched Original Theme for 100% Easy Reversibility)
// Palette: "Ivory & Royal Indigo" (light) / "Midnight Indigo" (dark)
// -----------------------------------------------------------------------------

export const classicLightColors: Palette = {
  primary: '#4f46e5',        // Royal Indigo
  primaryLight: '#e0e7ff',   // Soft Indigo Tint
  primaryDark: '#4338ca',    // Deep Royal Indigo

  secondary: '#a16207',      // Antique Gold
  secondaryLight: '#fef3c7', // Soft Gold Tint
  secondaryDark: '#854d0e',  // Deep Bronze Gold

  background: '#faf7f2',     // Warm Ivory canvas
  surface: '#ffffff',        // Pure white cards
  surfaceSubtle: '#f4efe6',  // Warm sand containers
  border: '#e7dfd2',         // Taupe dividers
  borderFocus: '#4f46e5',
  topPanel: '#ffffff',       // Top panel canvas in light mode
  topPanelBorder: '#e7dfd2', // Taupe dividers

  textPrimary: '#1c1917',    // Warm stone ink
  textSecondary: '#57534e',  // Muted warm gray
  textMuted: '#a8a29e',      // Fine captions
  textInverse: '#ffffff',

  success: '#059669',
  successLight: '#d1fae5',
  successDark: '#065f46',
  warning: '#d97706',
  warningLight: '#fef3c7',
  warningDark: '#92400e',
  danger: '#e11d48',
  dangerLight: '#ffe4e6',
  dangerDark: '#9f1239',
  info: '#0369a1',
  infoLight: '#e0f2fe',
  infoDark: '#075985',
  violet: '#7c3aed',
  violetLight: '#f3e8ff',
  violetDark: '#5b21b6',

  star: '#f59e0b',
};

export const classicDarkColors: Palette = {
  primary: '#a5b4fc',        // Luminous Indigo
  primaryLight: '#312e81',   // Indigo fill (dark tint)
  primaryDark: '#c7d2fe',    // Pale indigo text-on-fill

  secondary: '#fbbf24',      // Champagne Gold
  secondaryLight: '#451a03', // Deep amber fill
  secondaryDark: '#fcd34d',  // Pale gold text-on-fill

  background: '#0c101f',     // Deep midnight navy
  surface: '#151b2e',        // Card surface
  surfaceSubtle: '#1d2438',  // Raised containers
  border: '#2b3452',         // Muted indigo dividers
  borderFocus: '#a5b4fc',
  topPanel: '#0f172a',       // Deep midnight slate
  topPanelBorder: '#1e293b', // Muted dark dividers

  textPrimary: '#eef1f9',    // Near-white ink
  textSecondary: '#a9b1c9',  // Soft slate
  textMuted: '#6e7690',      // Dim captions
  textInverse: '#0c101f',

  success: '#34d399',
  successLight: '#064e3b',
  successDark: '#6ee7b7',
  warning: '#fbbf24',
  warningLight: '#451a03',
  warningDark: '#fcd34d',
  danger: '#fb7185',
  dangerLight: '#4c0519',
  dangerDark: '#fda4af',
  info: '#38bdf8',
  infoLight: '#0c4a6e',
  infoDark: '#7dd3fc',
  violet: '#a78bfa',
  violetLight: '#2e1065',
  violetDark: '#c4b5fd',

  star: '#fbbf24',
};

// -----------------------------------------------------------------------------
// THEME PRESET SWITCH
// 'modern' = Emerald & Midnight Abyss (Matches Login Screen)
// 'classic' = Royal Indigo & Warm Ivory (Original Theme)
// Change this single line to 'classic' to immediately revert back to original!
// -----------------------------------------------------------------------------
export type ThemePreset = 'modern' | 'classic';
export const DEFAULT_THEME_PRESET: ThemePreset = 'modern';

// Default direct exports referencing the active preset (modern by default)
export const lightColors: Palette = DEFAULT_THEME_PRESET === 'modern' ? modernLightColors : classicLightColors;
export const darkColors: Palette = DEFAULT_THEME_PRESET === 'modern' ? modernDarkColors : classicDarkColors;

// -----------------------------------------------------------------------------
// FIXED TOKENS
// -----------------------------------------------------------------------------

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  hero: 48,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const makeTypography = (colors: Palette) => ({
  fontDisplay: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  fontHeadline: { fontSize: 21, fontWeight: '700' as const, color: colors.textPrimary },
  fontTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.textPrimary },
  fontSubtitle: { fontSize: 14, fontWeight: '600' as const, color: colors.textPrimary },
  fontBody: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  fontBodySm: { fontSize: 12, fontWeight: '400' as const, color: colors.textMuted },
  fontCaption: { fontSize: 10, fontWeight: '500' as const, color: colors.textMuted },
});

export const makeShadows = (colors: Palette) => ({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});

// -----------------------------------------------------------------------------
// THEME CONTEXT — animated switching + dynamic preset support
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'sahakari_theme_v1';
const PRESET_KEY = 'sahakari_theme_preset_v1';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  colors: Palette;
  isDark: boolean;
  mode: ThemeMode;
  preset: ThemePreset;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  mode: 'light',
  preset: DEFAULT_THEME_PRESET,
  toggleTheme: () => {},
  setMode: () => {},
  setPreset: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() =>
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const [preset, setPresetState] = useState<ThemePreset>(DEFAULT_THEME_PRESET);
  const [hydrated, setHydrated] = useState(false);
  const [overlayActive, setOverlayActive] = useState(false);
  const switchingRef = useRef(false);
  const targetRef = useRef<ThemeMode>(mode);
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Restore the user's saved theme preference and preset
  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PRESET_KEY),
    ])
      .then(([savedMode, savedPreset]) => {
        if (!active) return;
        if (savedMode === 'light' || savedMode === 'dark') setModeState(savedMode);
        if (savedPreset === 'modern' || savedPreset === 'classic') setPresetState(savedPreset);
      })
      .catch(() => {})
      .finally(() => active && setHydrated(true));
    return () => {
      active = false;
    };
  }, []);

  const isDark = mode === 'dark';

  const colors = useMemo<Palette>(() => {
    if (preset === 'classic') {
      return isDark ? classicDarkColors : classicLightColors;
    }
    return isDark ? modernDarkColors : modernLightColors;
  }, [preset, isDark]);

  const commitMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const handleSetPreset = (nextPreset: ThemePreset) => {
    setPresetState(nextPreset);
    AsyncStorage.setItem(PRESET_KEY, nextPreset).catch(() => {});
  };

  // Smooth cross-fade: fade in the branded overlay, swap the palette in a
  // single render pass behind it, then fade out — no visible color jump.
  const switchMode = (next: ThemeMode) => {
    if (switchingRef.current || next === mode) return;
    switchingRef.current = true;
    setOverlayActive(true);
    targetRef.current = next;
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      commitMode(next);
      setTimeout(() => {
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          switchingRef.current = false;
          setOverlayActive(false);
        }, 340);
      }, 60);
    }, 170);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      isDark,
      mode,
      preset,
      toggleTheme: () => switchMode(isDark ? 'light' : 'dark'),
      setMode: switchMode,
      setPreset: handleSetPreset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, isDark, mode, preset]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}

      {/* Animated theme-switch overlay */}
      <Animated.View
        pointerEvents={overlayActive ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <View style={[styles.overlayBand, { backgroundColor: colors.surface }]} />
        <View style={styles.overlayContent}>
          <View style={[styles.overlayIconWrap, { backgroundColor: colors.primaryLight }]}>
            {targetRef.current === 'dark' ? (
              <Ionicons name="moon" size={38} color={colors.primary} />
            ) : (
              <Ionicons name="sunny" size={38} color={colors.secondary} />
            )}
          </View>
          <Text style={[styles.overlayBrand, { color: colors.textPrimary }]}>Sahakari Seva</Text>
          <Text style={[styles.overlayTagline, { color: colors.textSecondary }]}>
            {targetRef.current === 'dark' ? 'Dark Theme' : 'Light Theme'}
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ marginTop: 10 }}
          />
        </View>
      </Animated.View>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 99,
  },
  overlayBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  overlayBrand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  overlayTagline: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1.2,
  },
});

export default {
  lightColors,
  darkColors,
  modernLightColors,
  modernDarkColors,
  classicLightColors,
  classicDarkColors,
  DEFAULT_THEME_PRESET,
  spacing,
  radii,
  makeTypography,
  makeShadows,
  ThemeProvider,
  useTheme,
};
