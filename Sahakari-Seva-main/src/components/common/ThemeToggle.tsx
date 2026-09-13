// mobile/src/components/common/ThemeToggle.tsx
// ==============================================================================
// ANIMATED DARK/LIGHT THEME TOGGLE — springy pill switch with sun/moon cross-fade
// Tapping triggers the app-wide themed cross-fade overlay (see theme/ThemeProvider).
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, lightColors, darkColors } from '../../theme';

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 18;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const progress = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  // Slide the thumb when the theme changes from any source
  useEffect(() => {
    Animated.spring(progress, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 90,
    }).start();
  }, [isDark, progress]);

  const thumbX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, TRAVEL + 3],
  });

  const trackBg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColors.primaryLight, darkColors.surfaceSubtle],
  });

  const trackBorder = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [lightColors.border, darkColors.border],
  });

  const thumbBg = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#eef1f9'],
  });

  const sunOpacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const moonOpacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const sunScale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.6, 0.6] });
  const moonScale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.6, 1] });

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={({ pressed }) => [styles.press, pressed && styles.pressed]}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: trackBg, borderColor: trackBorder },
        ]}
      >
        {/* Sun icon (left side, visible in light mode) */}
        <Animated.View
          style={[styles.icon, styles.sunIcon, { opacity: sunOpacity, transform: [{ scale: sunScale }] }]}
          pointerEvents="none"
        >
          <Ionicons name="sunny" size={14} color={lightColors.secondaryDark} />
        </Animated.View>

        {/* Moon icon (right side, visible in dark mode) */}
        <Animated.View
          style={[styles.icon, styles.moonIcon, { opacity: moonOpacity, transform: [{ scale: moonScale }] }]}
          pointerEvents="none"
        >
          <Ionicons name="moon" size={13} color={lightColors.primary} />
        </Animated.View>

        {/* Sliding thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: thumbX }],
              backgroundColor: thumbBg,
              shadowColor: '#000',
            },
          ]}
        >
          <View style={styles.thumbGlow} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  press: {
    borderRadius: 99,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    width: 14,
  },
  sunIcon: {
    left: 4,
  },
  moonIcon: {
    right: 4,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(79,70,229,0.18)',
  },
});

export default ThemeToggle;