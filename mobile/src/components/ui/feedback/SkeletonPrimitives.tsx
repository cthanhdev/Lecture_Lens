import React, { useEffect } from 'react'
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { KITSUNE_RADII, KITSUNE_SHADOWS } from '../../../theme/tokens'

export interface SkeletonBoneProps {
  width?: DimensionValue
  height?: number
  borderRadius?: number
  tone?: 'sakura' | 'coral' | 'cream'
  style?: StyleProp<ViewStyle>
}

const TONE_COLORS = {
  sakura: 'rgba(245, 195, 201, 0.42)',
  coral: 'rgba(244, 127, 114, 0.28)',
  cream: 'rgba(232, 214, 226, 0.52)',
} as const

/**
 * Animated Kitsune Soft skeleton bone with warm Sakura-Cream shimmer pulse.
 */
export const SkeletonBone: React.FC<SkeletonBoneProps> = ({
  width = '100%',
  height = 16,
  borderRadius = KITSUNE_RADII.pill,
  tone = 'sakura',
  style,
}) => {
  const pulse = useSharedValue(0.45)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: TONE_COLORS[tone],
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

export interface SkeletonMirukuCardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * Reusable Miruku Glass squircle container for skeleton screens across the app.
 */
export const SkeletonMirukuCard: React.FC<SkeletonMirukuCardProps> = ({
  children,
  style,
}) => <View style={[styles.mirukuCard, style]}>{children}</View>

export interface AuthFormSkeletonProps {
  variant?: 'sign-in' | 'create-account'
}

/**
 * Skeleton Screen mirroring Screen 05 (Sign In) or Screen 06 (Create Account) geometry.
 */
export const AuthFormSkeleton: React.FC<AuthFormSkeletonProps> = ({
  variant = 'sign-in',
}) => {
  const fieldCount = variant === 'create-account' ? 3 : 2

  return (
    <View style={styles.authContainer}>
      {/* Mascot glass squircle + heading bones */}
      <View style={styles.heroBlock}>
        <SkeletonMirukuCard style={styles.heroLogoCard}>
          <SkeletonBone width={72} height={72} borderRadius={20} tone="sakura" />
        </SkeletonMirukuCard>
        <SkeletonBone width={176} height={26} borderRadius={13} tone="cream" />
        <SkeletonBone width={224} height={14} borderRadius={7} tone="sakura" />
      </View>

      {/* Main Miruku Glass form card skeleton */}
      <SkeletonMirukuCard style={styles.formCard}>
        {Array.from({ length: fieldCount }).map((_, index) => (
          <View key={index} style={styles.fieldGroup}>
            <SkeletonBone width={98 + (index % 2) * 24} height={12} borderRadius={6} tone="cream" />
            <SkeletonBone width="100%" height={52} borderRadius={KITSUNE_RADII.pill} tone="sakura" />
          </View>
        ))}

        {variant === 'create-account' ? (
          <>
            <View style={styles.meterRow}>
              <SkeletonBone width="31%" height={6} borderRadius={3} tone="sakura" />
              <SkeletonBone width="31%" height={6} borderRadius={3} tone="sakura" />
              <SkeletonBone width="31%" height={6} borderRadius={3} tone="cream" />
            </View>
            <View style={styles.checkboxRow}>
              <SkeletonBone width={22} height={22} borderRadius={7} tone="sakura" />
              <SkeletonBone width="72%" height={13} borderRadius={6} tone="cream" />
            </View>
          </>
        ) : (
          <View style={styles.forgotAlign}>
            <SkeletonBone width={108} height={12} borderRadius={6} tone="coral" />
          </View>
        )}

        <SkeletonBone
          width="100%"
          height={52}
          borderRadius={KITSUNE_RADII.pill}
          tone="coral"
          style={styles.ctaGap}
        />
      </SkeletonMirukuCard>

      {/* OR divider & social pills */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <SkeletonBone width={28} height={12} borderRadius={6} tone="cream" />
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialGroup}>
        <SkeletonBone width="100%" height={52} borderRadius={KITSUNE_RADII.pill} tone="cream" />
        <SkeletonBone width="100%" height={52} borderRadius={KITSUNE_RADII.pill} tone="sakura" />
      </View>

      <View style={styles.footerAlign}>
        <SkeletonBone width={186} height={14} borderRadius={7} tone="cream" />
      </View>
    </View>
  )
}

/**
 * Reusable Bento Grid skeleton for Home Dashboard (Screen 08) & Library (Screen 13).
 */
export const DashboardBentoSkeleton: React.FC = () => (
  <View style={styles.dashboardContainer}>
    <SkeletonMirukuCard style={styles.heroCard}>
      <View style={styles.heroRow}>
        <View style={styles.heroTextCol}>
          <SkeletonBone width={110} height={18} borderRadius={9} tone="coral" />
          <SkeletonBone width={200} height={24} borderRadius={12} tone="cream" />
          <SkeletonBone width={160} height={14} borderRadius={7} tone="sakura" />
        </View>
        <SkeletonBone width={68} height={68} borderRadius={22} tone="sakura" />
      </View>
      <SkeletonBone width="100%" height={46} borderRadius={KITSUNE_RADII.pill} tone="coral" />
    </SkeletonMirukuCard>

    <View style={styles.bentoRow}>
      <SkeletonMirukuCard style={styles.bentoTile}>
        <SkeletonBone width={38} height={38} borderRadius={19} tone="sakura" />
        <SkeletonBone width={76} height={20} borderRadius={10} tone="cream" />
        <SkeletonBone width={98} height={12} borderRadius={6} tone="sakura" />
      </SkeletonMirukuCard>
      <SkeletonMirukuCard style={styles.bentoTile}>
        <SkeletonBone width={38} height={38} borderRadius={19} tone="coral" />
        <SkeletonBone width={76} height={20} borderRadius={10} tone="cream" />
        <SkeletonBone width={98} height={12} borderRadius={6} tone="sakura" />
      </SkeletonMirukuCard>
    </View>

    {[0, 1, 2].map((item) => (
      <SkeletonMirukuCard key={item} style={styles.lectureRowCard}>
        <SkeletonBone width={44} height={44} borderRadius={16} tone="sakura" />
        <View style={styles.lectureRowText}>
          <SkeletonBone width="80%" height={15} borderRadius={7} tone="cream" />
          <SkeletonBone width="52%" height={12} borderRadius={6} tone="sakura" />
        </View>
      </SkeletonMirukuCard>
    ))}
  </View>
)

const styles = StyleSheet.create({
  mirukuCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    ...KITSUNE_SHADOWS.miruku,
  },
  authContainer: {
    width: '100%',
    gap: 18,
  },
  heroBlock: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
  },
  heroLogoCard: {
    width: 96,
    height: 96,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formCard: {
    padding: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  forgotAlign: {
    alignItems: 'flex-end',
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaGap: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(38, 19, 51, 0.08)',
  },
  socialGroup: {
    gap: 12,
  },
  footerAlign: {
    alignItems: 'center',
    paddingTop: 4,
  },
  dashboardContainer: {
    width: '100%',
    gap: 14,
  },
  heroCard: {
    padding: 18,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroTextCol: {
    flex: 1,
    gap: 8,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoTile: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  lectureRowCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lectureRowText: {
    flex: 1,
    gap: 8,
  },
})
