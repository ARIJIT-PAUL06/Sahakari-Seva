// ==============================================================================
// SCALE PRESSABLE — Springy tactile press & hover feedback for interactive UI
// Scales content down smoothly on press-in, lifts subtly on hover (web),
// and springs back crisply on release without compromising responsiveness.
// ==============================================================================

import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ScalePressableProps {
  onPress?: () => void;
  /** Scale factor while pressed. Default 0.95. */
  scaleTo?: number;
  /** Lift in px while hovered on desktop web (e.g. -2 or -3). Default 0. */
  hoverLift?: number;
  /** Scale factor while hovered on desktop web. Default 1. */
  hoverScale?: number;
  /** Vibrate on press (Android haptics work inside Expo Go). */
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: any;
  accessibilityLabel?: string;
  testID?: string;
  children: React.ReactNode;
}

export const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  scaleTo = 0.95,
  hoverLift = 0,
  hoverScale = 1,
  haptic = true,
  style,
  disabled = false,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
  children,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isHovered, setIsHovered] = useState(false);

  const animateTo = (targetScale: number, targetY: number, snappy = false) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: Platform.OS !== 'web',
        speed: snappy ? 40 : 32,
        bounciness: snappy ? 3 : 5,
      }),
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: Platform.OS !== 'web',
        speed: snappy ? 40 : 32,
        bounciness: snappy ? 3 : 5,
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (disabled) return;
    if (haptic && Platform.OS !== 'web') {
      void Haptics.selectionAsync().catch(() => undefined);
    }
    animateTo(scaleTo, 0, true);
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (isHovered && Platform.OS === 'web') {
      animateTo(hoverScale, hoverLift, false);
    } else {
      animateTo(1, 0, false);
    }
  };

  const handleHoverIn = () => {
    if (disabled || Platform.OS !== 'web') return;
    setIsHovered(true);
    animateTo(hoverScale, hoverLift, false);
  };

  const handleHoverOut = () => {
    if (disabled || Platform.OS !== 'web') return;
    setIsHovered(false);
    animateTo(1, 0, false);
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }, { translateY }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={
          Platform.OS === 'web'
            ? ({ cursor: disabled ? 'default' : 'pointer' } as any)
            : undefined
        }
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default ScalePressable;