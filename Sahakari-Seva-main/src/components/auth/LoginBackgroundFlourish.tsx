// ==============================================================================
// LOGIN BACKGROUND FLOURISH — DUAL THEME (DARK & LIGHT)
// Renders the authentic patriotic flourishes visible in the reference design:
// 1. Large faint Ashoka Chakra watermark in the upper-right background
// 2. Graceful swooping Indian Tricolor ribbon on the left edge
// 3. Graceful swooping Indian Tricolor ribbon on the right edge
// Pointer-events none, non-intrusive, and adapts seamlessly to both themes.
// ==============================================================================

import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  G,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

interface LoginBackgroundFlourishProps {
  isDark: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LoginBackgroundFlourish: React.FC<LoginBackgroundFlourishProps> = ({ isDark }) => {
  // Theme-aware tokens
  const chakraStroke = isDark ? '#38bdf8' : '#1e3a8a';
  const chakraOpacity = isDark ? 0.14 : 0.08;

  // 24 spokes for Ashoka Chakra (every 15 degrees)
  const chakraCX = 150;
  const chakraCY = 150;
  const chakraRadius = 135;
  const innerRadius = 22;

  const spokes = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const angleRad = (i * 15 * Math.PI) / 180;
      return {
        x1: chakraCX + innerRadius * Math.cos(angleRad),
        y1: chakraCY + innerRadius * Math.sin(angleRad),
        x2: chakraCX + (chakraRadius - 8) * Math.cos(angleRad),
        y2: chakraCY + (chakraRadius - 8) * Math.sin(angleRad),
        key: `watermark-spoke-${i}`,
      };
    });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, styles.flourishContainer]} pointerEvents="none">
      {/* =================================================================== */}
      {/* 1. UPPER-RIGHT ASHOKA CHAKRA WATERMARK                              */}
      {/* =================================================================== */}
      <View style={styles.chakraWrap}>
        <View style={styles.chakraInner}>
          <Svg width={280} height={280} viewBox="0 0 300 300">
          <G opacity={chakraOpacity}>
            {/* Outer Rim */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={chakraRadius}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={3}
            />
            {/* Concentric Step Rim */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={chakraRadius - 8}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={1.5}
            />
            {/* Center Outer Hub */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={innerRadius}
              fill="none"
              stroke={chakraStroke}
              strokeWidth={2.5}
            />
            {/* Center Solid Pivot */}
            <Circle
              cx={chakraCX}
              cy={chakraCY}
              r={7}
              fill={chakraStroke}
            />
            {/* 24 Radial Spokes */}
            {spokes.map((s) => (
              <Line
                key={s.key}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={chakraStroke}
                strokeWidth={1.8}
              />
            ))}
          </G>
        </Svg>
        </View>
      </View>

      {/* =================================================================== */}
      {/* 2. AMBIENT TRICOLOR ATMOSPHERE (SOFT FEATHERED AURAS - ZERO CUTOFFS)*/}
      {/* =================================================================== */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Soft Ambient Saffron Halo (Top-Right near Chakra) */}
            <SvgLinearGradient id="ambientSaffronGrad" x1="1" y1="0" x2="0.3" y2="0.7">
              <Stop offset="0%" stopColor="#FF9933" stopOpacity={isDark ? 0.12 : 0.09} />
              <Stop offset="50%" stopColor="#FF9933" stopOpacity={isDark ? 0.04 : 0.03} />
              <Stop offset="100%" stopColor="#FF9933" stopOpacity={0} />
            </SvgLinearGradient>

            {/* Soft Ambient Emerald Halo (Mid/Lower-Left) */}
            <SvgLinearGradient id="ambientGreenGrad" x1="0" y1="0.6" x2="0.7" y2="1">
              <Stop offset="0%" stopColor="#138808" stopOpacity={isDark ? 0.10 : 0.07} />
              <Stop offset="50%" stopColor="#138808" stopOpacity={isDark ? 0.03 : 0.02} />
              <Stop offset="100%" stopColor="#138808" stopOpacity={0} />
            </SvgLinearGradient>

            {/* Ethereal Silk Curve Gradient (Tricolor Hairline Wave) */}
            <SvgLinearGradient id="silkSaffronFade" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FF9933" stopOpacity={isDark ? 0.25 : 0.20} />
              <Stop offset="60%" stopColor="#FF9933" stopOpacity={isDark ? 0.08 : 0.06} />
              <Stop offset="100%" stopColor="#FF9933" stopOpacity={0} />
            </SvgLinearGradient>

            <SvgLinearGradient id="silkWhiteFade" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.35 : 0.30} />
              <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={isDark ? 0.10 : 0.08} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgLinearGradient>

            <SvgLinearGradient id="silkGreenFade" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#138808" stopOpacity={isDark ? 0.25 : 0.20} />
              <Stop offset="60%" stopColor="#138808" stopOpacity={isDark ? 0.08 : 0.06} />
              <Stop offset="100%" stopColor="#138808" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>

          {/* Saffron Ambient Glow Field */}
          <Circle cx="85%" cy="20%" r="240" fill="url(#ambientSaffronGrad)" />

          {/* Green Ambient Glow Field */}
          <Circle cx="12%" cy="52%" r="220" fill="url(#ambientGreenGrad)" />

          {/* Ethereal Flowing Left Silk Curve — Dissolves smoothly with 0% opacity taper */}
          <Path
            d="M -10 180 C 40 210, 80 250, 110 310 C 130 350, 140 400, 120 440"
            fill="none"
            stroke="url(#silkSaffronFade)"
            strokeWidth={1.8}
          />
          <Path
            d="M -10 184 C 40 214, 80 254, 110 314 C 130 354, 140 404, 120 444"
            fill="none"
            stroke="url(#silkWhiteFade)"
            strokeWidth={1.5}
          />
          <Path
            d="M -10 188 C 40 218, 80 258, 110 318 C 130 358, 140 408, 120 448"
            fill="none"
            stroke="url(#silkGreenFade)"
            strokeWidth={1.8}
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flourishContainer: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  chakraWrap: {
    position: 'absolute',
    top: 100,
    right: -20,
    width: 220,
    height: 280,
    zIndex: 1,
    overflow: 'hidden',
  },
  chakraInner: {
    position: 'absolute',
    top: 0,
    right: -40,
    width: 280,
    height: 280,
  },
});

export default LoginBackgroundFlourish;
