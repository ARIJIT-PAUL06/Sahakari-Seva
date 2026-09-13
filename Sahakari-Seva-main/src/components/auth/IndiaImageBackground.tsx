// ==============================================================================
// INDIA IMAGE BACKGROUND — PHOTO BACKGROUND + ANIMATED ACTIVITY DOTS
// - Uses the actual India map photo (assets/india-map-bg.jpg) as background.
// - Overlays the same 18 city activity dots from IndiaMapOverlay.tsx using
//   SVG coordinates calibrated to match the photo's India map geography.
// - Preserves all animation logic: 4-phase staggered pulse with halos.
// - Covers the full screen (StyleSheet.absoluteFill).
// - pointerEvents="none" so foreground interactions pass through.
//
// EASY REVERT: In LoginScreen.tsx, set USE_IMAGE_BACKGROUND = false to restore
// the original gradient + SVG map + flourish background instantly.
// ==============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CityDot {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'worker' | 'customer';
  phase: 'A' | 'B' | 'C' | 'D';
}

// Same NETWORK_NODES as IndiaMapOverlay.tsx — coordinates map directly to the photo
const CITY_DOTS: CityDot[] = [
  { id: 'sri', name: 'Srinagar',     x: 305, y: 195, type: 'customer', phase: 'D' },
  { id: 'chd', name: 'Chandigarh',  x: 335, y: 265, type: 'worker',   phase: 'C' },
  { id: 'del', name: 'Delhi NCR',   x: 350, y: 325, type: 'worker',   phase: 'A' },
  { id: 'luc', name: 'Lucknow',     x: 465, y: 395, type: 'customer', phase: 'B' },
  { id: 'jai', name: 'Jaipur',      x: 305, y: 385, type: 'customer', phase: 'C' },
  { id: 'ahm', name: 'Ahmedabad',   x: 250, y: 505, type: 'worker',   phase: 'B' },
  { id: 'mum', name: 'Mumbai',      x: 275, y: 605, type: 'customer', phase: 'A' },
  { id: 'pun', name: 'Pune',        x: 310, y: 630, type: 'worker',   phase: 'C' },
  { id: 'bho', name: 'Bhopal',      x: 385, y: 495, type: 'worker',   phase: 'D' },
  { id: 'nag', name: 'Nagpur',      x: 420, y: 555, type: 'customer', phase: 'B' },
  { id: 'hyd', name: 'Hyderabad',   x: 405, y: 645, type: 'worker',   phase: 'A' },
  { id: 'blr', name: 'Bengaluru',   x: 370, y: 765, type: 'worker',   phase: 'C' },
  { id: 'che', name: 'Chennai',     x: 440, y: 775, type: 'customer', phase: 'D' },
  { id: 'koc', name: 'Kochi',       x: 350, y: 845, type: 'worker',   phase: 'B' },
  { id: 'pat', name: 'Patna',       x: 550, y: 415, type: 'worker',   phase: 'A' },
  { id: 'kol', name: 'Kolkata',     x: 610, y: 525, type: 'customer', phase: 'D' },
  { id: 'bhu', name: 'Bhubaneswar', x: 565, y: 595, type: 'customer', phase: 'C' },
  { id: 'guw', name: 'Guwahati',    x: 725, y: 405, type: 'worker',   phase: 'B' },
];

interface IndiaImageBackgroundProps {
  isDark?: boolean;
}

export const IndiaImageBackground: React.FC<IndiaImageBackgroundProps> = ({ isDark = false }) => {
  const pulseA = useRef(new Animated.Value(0)).current;
  const pulseB = useRef(new Animated.Value(0)).current;
  const pulseC = useRef(new Animated.Value(0)).current;
  const pulseD = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const loopA = createLoop(pulseA, 0,    1900);
    const loopB = createLoop(pulseB, 450,  2200);
    const loopC = createLoop(pulseC, 900,  1800);
    const loopD = createLoop(pulseD, 1350, 2400);

    loopA.start();
    loopB.start();
    loopC.start();
    loopD.start();

    return () => {
      loopA.stop();
      loopB.stop();
      loopC.stop();
      loopD.stop();
    };
  }, [pulseA, pulseB, pulseC, pulseD]);

  const getAnim = (phase: CityDot['phase']) => {
    switch (phase) {
      case 'A': return pulseA;
      case 'B': return pulseB;
      case 'C': return pulseC;
      case 'D': return pulseD;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Full-screen India map photo */}
      <Image
        source={require('../../../assets/india-map-bg.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* Animated city activity dots — same SVG coordinate system as IndiaMapOverlay */}
      <Svg
        viewBox="60 16 880 932"
        style={StyleSheet.absoluteFill}
        preserveAspectRatio="xMidYMid meet"
      >
        {CITY_DOTS.map((dot) => {
          const anim = getAnim(dot.phase);
          const isWorker = dot.type === 'worker';
          const coreColor = isWorker ? '#10b981' : '#f43f5e';
          const ringColor = isWorker
            ? 'rgba(16, 185, 129, 0.55)'
            : 'rgba(244, 63, 94, 0.55)';

          const haloRadius = anim.interpolate({
            inputRange:  [0, 1],
            outputRange: [6, 18],
          });
          const haloOpacity = anim.interpolate({
            inputRange:  [0, 0.5, 1],
            outputRange: [0.85, 0.40, 0.0],
          });

          const nodeFade = dot.y > 800 ? 0.65 : 1.0;

          return (
            <G key={dot.id} transform={`translate(${dot.x}, ${dot.y})`} opacity={nodeFade}>
              <AnimatedCircle
                r={haloRadius}
                fill="none"
                stroke={ringColor}
                strokeWidth="2"
                opacity={haloOpacity}
              />
              <Circle r={7}   fill={coreColor} opacity={0.30} />
              <Circle r={3.5} fill={coreColor} opacity={0.98} />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

export default IndiaImageBackground;
