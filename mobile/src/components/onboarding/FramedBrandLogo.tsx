// FramedBrandLogo: Official LectureLens Fox Logo framed inside Miruku Glass squircles
// Nguồn gốc logo: docs/design-assets/branding/logo-LectureLens.png
import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'

const BRAND_LOGO = require('../../../assets/images/logo-LectureLens.png')

interface FramedBrandLogoProps {
  variant: 'splash' | 'step1'
  scale?: number
}

interface PetalAccentSpec {
  top?: number
  bottom?: number
  left?: number
  right?: number
  width: number
  height: number
  rotate: string
}

// Sakura accent dots & sparkle accents positioned per 01-Splash / 02-Step1 SVGs
const SPLASH_PETAL_ACCENTS: readonly PetalAccentSpec[] = [
  { top: 18, left: 26, width: 12, height: 15, rotate: '-12deg' },
  { top: 32, right: 20, width: 10, height: 13, rotate: '45deg' },
  { top: 132, left: 10, width: 10, height: 13, rotate: '12deg' },
  { bottom: 18, left: 32, width: 10, height: 13, rotate: '-45deg' },
  { bottom: 20, right: 28, width: 12, height: 15, rotate: '18deg' },
]

export const FramedBrandLogo: React.FC<FramedBrandLogoProps> = ({
  variant,
  scale = 1,
}) => {
  if (variant === 'splash') {
    const outerRing = Math.round(263 * scale)
    const innerRing = Math.round(219 * scale)
    const glassSize = Math.round(168 * scale)
    const innerSize = Math.round(150 * scale)

    return (
      <View
        style={[
          styles.splashStage,
          { width: outerRing, height: outerRing },
        ]}
      >
        {/* Outer & inner concentric halo rings */}
        <View
          style={[
            styles.splashOuterRing,
            {
              width: outerRing,
              height: outerRing,
              borderRadius: outerRing / 2,
            },
          ]}
        />
        <View
          style={[
            styles.splashInnerRing,
            {
              width: innerRing,
              height: innerRing,
              borderRadius: innerRing / 2,
            },
          ]}
        />

        {/* Delicate sakura petals around concentric rings */}
        {SPLASH_PETAL_ACCENTS.map((petal, idx) => (
          <View
            key={idx}
            style={[
              styles.petalAccent,
              {
                top: petal.top,
                bottom: petal.bottom,
                left: petal.left,
                right: petal.right,
                width: petal.width,
                height: petal.height,
                borderRadius: petal.width,
                transform: [{ rotate: petal.rotate }],
              },
            ]}
          />
        ))}

        {/* Golden Mochi Sparkle accent */}
        <View style={[styles.splashSparkle, { top: 24 * scale, right: 42 * scale }]}>
          <Icon
            name="sparkles"
            size={16}
            strokeColor={KITSUNE_COLORS.mochiYellow}
          />
        </View>

        {/* Frosted Miruku Glass card containing warm cream frame + official Fox logo */}
        <View
          style={[
            styles.splashGlassCard,
            {
              width: glassSize,
              height: glassSize,
              borderRadius: Math.round(44 * scale),
            },
          ]}
        >
          <View
            style={[
              styles.splashCreamFrame,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: Math.round(38 * scale),
              },
            ]}
          >
            <Image
              source={BRAND_LOGO}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityLabel="LectureLens Kitsune mascot logo"
            />
          </View>
        </View>
      </View>
    )
  }

  // Step 1 Onboarding preset (Tilted Mist Sky layer + Miruku Glass frame + top-right sparkles badge)
  const cardSize = Math.round(236 * scale)
  const backingSize = Math.round(268 * scale)
  const innerSize = Math.round(212 * scale)

  return (
    <View
      style={[
        styles.step1Stage,
        { width: backingSize + 16, height: backingSize + 12 },
      ]}
    >
      {/* Tilted Mist Sky backing squircle (-3deg per SVG 02) */}
      <View
        style={[
          styles.step1TiltedBacking,
          {
            width: backingSize,
            height: backingSize,
            borderRadius: Math.round(36 * scale),
          },
        ]}
      />

      {/* Decorative ambient sakura petals matching SVG 02 */}
      <View style={[styles.petalAccent, styles.step1PetalTopLeft]} />
      <View style={[styles.petalAccent, styles.step1PetalBottomRight]} />

      {/* Main Miruku Glass Logo Frame */}
      <View
        style={[
          styles.step1GlassCard,
          {
            width: cardSize,
            height: cardSize,
            borderRadius: Math.round(28 * scale),
          },
        ]}
      >
        <View
          style={[
            styles.step1InnerFrame,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: Math.round(22 * scale),
            },
          ]}
        >
          <Image
            source={BRAND_LOGO}
            style={styles.logoImage}
            resizeMode="cover"
            accessibilityLabel="LectureLens Kitsune recording companion logo"
          />
        </View>

        {/* Top-right Sparkles Badge */}
        <View style={styles.step1SparkleBadge}>
          <Icon
            name="sparkles"
            size="xs"
            strokeColor={KITSUNE_COLORS.kitsuneCoral}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  splashStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashOuterRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(169, 212, 232, 0.40)',
  },
  splashInnerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.25)',
  },
  splashSparkle: {
    position: 'absolute',
  },
  petalAccent: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 195, 201, 0.65)',
  },
  splashGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.plumModal,
  },
  splashCreamFrame: {
    backgroundColor: '#FDF5E8',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  step1Stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  step1TiltedBacking: {
    position: 'absolute',
    backgroundColor: 'rgba(162, 205, 225, 0.45)',
    transform: [{ rotate: '-3deg' }],
  },
  step1PetalTopLeft: {
    top: 10,
    left: 22,
    width: 14,
    height: 18,
    borderRadius: 9,
    transform: [{ rotate: '-28deg' }],
  },
  step1PetalBottomRight: {
    bottom: 18,
    right: 18,
    width: 12,
    height: 15,
    borderRadius: 8,
    transform: [{ rotate: '22deg' }],
  },
  step1GlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.plumModal,
  },
  step1InnerFrame: {
    backgroundColor: '#FDF5E8',
    overflow: 'hidden',
  },
  step1SparkleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
})
