import React, { ReactNode } from 'react';
import {
  Pressable,
  PressableProps,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppMotionTokens } from '../../../core/motion/motionTokens';

export interface LlPressableProps extends Omit<PressableProps, 'style'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleFactor?: number;
  enableHaptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LlPressable = ({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  scaleFactor = AppMotionTokens.scalePressFactor,
  enableHaptic = true,
  disabled = false,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ...restProps
}: LlPressableProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;
    scale.value = withSpring(scaleFactor, AppMotionTokens.springDefault);
    if (enableHaptic) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.value = withSpring(1, AppMotionTokens.springBouncy);
    if (disabled) return;
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      style={[style, animatedStyle]}
      {...restProps}
    >
      {children}
    </AnimatedPressable>
  );
};
