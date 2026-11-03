import React, { useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, Ellipse, Line, G } from 'react-native-svg';
import { SvgIllustrations } from '../../../core/constants/assetPaths';
import { LlPressable } from '../interactive/LlPressable';

export type CuMeoVariant =
  | 'idle'
  | 'listening'
  | 'happy'
  | 'sleeping'
  | 'processing'
  | 'confused'
  | 'star_eyes';

interface CuMeoWidgetProps {
  variant?: CuMeoVariant;
  size?: number;
  isAnimated?: boolean;
  onTap?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Inline SVG: Sleeping owl from stitch_lecturelens_app_design_system/th_vi_n_b_i_gi_ng
const SleepingOwlSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    {/* Mint Headphones headband */}
    <Path d="M40 76 C40 38, 120 38, 120 76" stroke="#9FDAC4" strokeLinecap="round" strokeWidth={8} />
    <Path d="M48 76 C48 46, 112 46, 112 76" stroke="#5445B6" strokeDasharray="3 3" strokeLinecap="round" strokeWidth={2} />
    {/* Headphone ear pads */}
    <Rect x={30} y={66} width={14} height={28} rx={7} fill="#C7BFFF" stroke="#5445B6" strokeWidth={2} />
    <Rect x={116} y={66} width={14} height={28} rx={7} fill="#C7BFFF" stroke="#5445B6" strokeWidth={2} />
    {/* Owl Body */}
    <Ellipse cx={80} cy={94} rx={42} ry={46} fill="#FFFFFF" stroke="#5445B6" strokeWidth={2.5} />
    <Ellipse cx={80} cy={104} rx={28} ry={30} fill="#F4EFFF" />
    {/* Soft Blush Cheeks */}
    <Circle cx={56} cy={95} r={7} fill="#FECDDD" opacity={0.9} />
    <Circle cx={104} cy={95} r={7} fill="#FECDDD" opacity={0.9} />
    {/* Sleeping Eyes */}
    <Path d="M52 86 Q60 92 68 86" stroke="#5445B6" strokeLinecap="round" strokeWidth={3} fill="none" />
    <Path d="M92 86 Q100 92 108 86" stroke="#5445B6" strokeLinecap="round" strokeWidth={3} fill="none" />
    {/* Cute Little Beak */}
    <Path d="M77 91 L83 91 L80 97 Z" fill="#FFAA47" />
    {/* Little Feet */}
    <Ellipse cx={70} cy={138} rx={7} ry={4} fill="#FFAA47" />
    <Ellipse cx={90} cy={138} rx={7} ry={4} fill="#FFAA47" />
    {/* Open Notebook in front */}
    <Path d="M50 144 L80 138 L110 144 L110 152 L80 146 L50 152 Z" fill="#E8DEF8" stroke="#5445B6" strokeWidth={1.5} />
    <Line x1={80} y1={138} x2={80} y2={146} stroke="#5445B6" strokeWidth={1.5} />
  </Svg>
);

// Inline SVG: Star eyes owl from splash_ai_kh_i_ng
const StarEyesOwlSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    {/* Ambient Sparkles */}
    <G>
      <Path d="M165 35L167.5 43L175.5 45.5L167.5 48L165 56L162.5 48L154.5 45.5L162.5 43L165 35Z" fill="#FECDDD" />
      <Path d="M35 50L37 57L44 59L37 61L35 68L33 61L26 59L33 57L35 50Z" fill="#C7BFFF" />
      <Path d="M172 130L173.5 135L178.5 136.5L173.5 138L172 143L170.5 138L165.5 136.5L170.5 135L172 130Z" fill="#CAE9DF" />
    </G>
    {/* Owl Body */}
    <Ellipse cx={100} cy={115} rx={58} ry={60} fill="#FFFFFF" />
    <Ellipse cx={100} cy={165} rx={42} ry={12} fill="#EDE4FF" opacity={0.6} />
    <Ellipse cx={100} cy={125} rx={40} ry={42} fill="#FFFAF5" />
    {/* Wings */}
    <Path d="M42 115C42 100 48 88 56 94C56 112 50 134 42 115Z" fill="#EDE4FF" />
    <Path d="M158 115C158 100 152 88 144 94C144 112 150 134 158 115Z" fill="#EDE4FF" />
    {/* Cheeks */}
    <Circle cx={68} cy={118} r={11} fill="#FECDDD" opacity={0.85} />
    <Circle cx={132} cy={118} r={11} fill="#FECDDD" opacity={0.85} />
    {/* Star Eyes Left */}
    <Circle cx={76} cy={100} r={17} fill="#1D1831" />
    <Path d="M76 89L78.2 96L85.2 98.2L78.2 100.4L76 107.4L73.8 100.4L66.8 98.2L73.8 96L76 89Z" fill="#FFFFFF" />
    <Circle cx={82} cy={94} r={2.5} fill="#FFE28A" />
    {/* Star Eyes Right */}
    <Circle cx={124} cy={100} r={17} fill="#1D1831" />
    <Path d="M124 89L126.2 96L133.2 98.2L126.2 100.4L124 107.4L121.8 100.4L114.8 98.2L121.8 96L124 89Z" fill="#FFFFFF" />
    <Circle cx={130} cy={94} r={2.5} fill="#FFE28A" />
    {/* Beak */}
    <Path d="M96 107C96 103 104 103 104 107L100 115Z" fill="#E8A938" />
    {/* Headphones */}
    <Path d="M46 102C46 56 68 44 100 44C132 44 154 56 154 102" fill="none" stroke="#6D5FD0" strokeLinecap="round" strokeWidth={6.5} />
  </Svg>
);

// Inline SVG: Confused/Offline owl from splash_l_i_k_t_n_i
const ConfusedOwlSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
    <Ellipse cx={80} cy={144} rx={46} ry={7} fill="#dfd5f8" opacity={0.6} />
    <Path d="M42 66 C40 34, 116 32, 118 64" fill="none" stroke="#405c54" strokeLinecap="round" strokeWidth={6} />
    <Path d="M80 34 C50 34, 38 56, 38 96 C38 128, 54 138, 80 138 C106 138, 122 128, 122 96 C122 56, 110 34, 80 34 Z" fill="#FFFFFF" stroke="#c9c4d5" strokeWidth={2} />
    <Path d="M80 78 C64 78, 52 90, 52 114 C52 130, 64 135, 80 135 C96 135, 108 130, 108 114 C108 90, 96 78, 80 78 Z" fill="#F8F1FF" />
    {/* Worried Eyebrows */}
    <Path d="M54 53 C59 55, 68 59, 72 61" stroke="#5445b6" strokeLinecap="round" strokeWidth={2.5} />
    <Path d="M106 53 C101 55, 92 59, 88 61" stroke="#5445b6" strokeLinecap="round" strokeWidth={2.5} />
    {/* Pupils looking concerned */}
    <Circle cx={66} cy={71} r={7} fill="#1D1831" />
    <Circle cx={63} cy={68} r={2.5} fill="#FFFFFF" />
    <Circle cx={94} cy={71} r={7} fill="#1D1831" />
    <Circle cx={91} cy={68} r={2.5} fill="#FFFFFF" />
    {/* Cheeks */}
    <Circle cx={52} cy={82} r={7} fill="#fecddd" opacity={0.8} />
    <Circle cx={108} cy={82} r={7} fill="#fecddd" opacity={0.8} />
    {/* Small beak */}
    <Path d="M76 76 L84 76 L80 84 Z" fill="#FFAA47" />
    {/* Sweatdrop */}
    <Path d="M116 48 C116 42, 122 34, 122 34 C122 34, 128 42, 128 48 C128 52, 124 55, 122 55 C120 55, 116 52, 116 48 Z" fill="#d8e9fb" stroke="#2d486b" strokeWidth={1} />
  </Svg>
);

export const CuMeoWidget = ({
  variant = 'idle',
  size = 140,
  isAnimated = true,
  onTap,
  style,
}: CuMeoWidgetProps) => {
  const translateY = useSharedValue(0);
  const tilt = useSharedValue(0);
  const bounceScale = useSharedValue(1);

  useEffect(() => {
    if (isAnimated) {
      // Float up and down smoothly
      translateY.value = withRepeat(
        withTiming(-5, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );

      // Nghiêng đầu nhẹ khi lắng nghe hoặc xử lý
      if (variant === 'listening' || variant === 'processing') {
        tilt.value = withRepeat(
          withTiming(0.04, {
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        );
      }
    } else {
      translateY.value = 0;
      tilt.value = 0;
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(tilt);
      cancelAnimation(bounceScale);
    };
  }, [isAnimated, variant]);

  const handleMascotTap = () => {
    bounceScale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 250 }),
      withSpring(1.0, { damping: 10, stiffness: 180 })
    );

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}

    onTap?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${tilt.value}rad` },
      { scale: bounceScale.value },
    ],
  }));

  const renderSvg = () => {
    switch (variant) {
      case 'sleeping':
        return <SleepingOwlSvg size={size} />;
      case 'star_eyes':
        return <StarEyesOwlSvg size={size} />;
      case 'confused':
        return <ConfusedOwlSvg size={size} />;
      case 'listening':
      case 'processing':
        return <SvgIllustrations.CuMeoListening width={size} height={size} />;
      case 'happy':
        return <SvgIllustrations.CuMeoHappy width={size} height={size} />;
      case 'idle':
      default:
        return <SvgIllustrations.CuMeoHappy width={size} height={size} />;
    }
  };

  return (
    <LlPressable
      disabled={!onTap}
      onPress={handleMascotTap}
      style={[styles.container, style]}
      scaleFactor={0.98}
    >
      <Animated.View style={animatedStyle}>{renderSvg()}</Animated.View>
    </LlPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
