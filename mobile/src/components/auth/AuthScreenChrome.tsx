import React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import type {
  PreviewOverrideState,
  ServiceAvailability,
} from '../../modules/resilience'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { FloatingPetals2D } from '../canvas'
import { AuthFormSkeleton, ServiceStateCard } from '../ui/feedback'
import { Icon } from '../ui/icons'

export interface AuthScreenChromeProps {
  title: string
  skeletonVariant: 'sign-in' | 'create-account'
  availability: ServiceAvailability
  previewOverride: PreviewOverrideState
  isRetrying: boolean
  hasWarningDot?: boolean
  onPressBack: () => void
  onPressInspector: () => void
  onResetPreview: () => void
  onRetry: () => void
  onContinueDemo: () => void
  children: React.ReactNode
}

/**
 * Shared mobile frame chrome for Screens 05 & 06:
 * - 390px centered canvas on Washi Cream (#FFF7FD)
 * - Soft ambient orbs + FloatingPetals2D
 * - Frosted Top Navigation Bar (< back, centered title, #A03F36 inspector profile badge)
 * - Automatic Skeleton / No Internet / Server Error fallback rendering
 */
export const AuthScreenChrome: React.FC<AuthScreenChromeProps> = ({
  title,
  skeletonVariant,
  availability,
  previewOverride,
  isRetrying,
  hasWarningDot = false,
  onPressBack,
  onPressInspector,
  onResetPreview,
  onRetry,
  onContinueDemo,
  children,
}) => {
  const { width } = useWindowDimensions()
  const frameWidth = width <= 440 ? width : 390

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={[styles.mobileFrame, { width: frameWidth }]}>
        {/* Soft Sakura blush radial wash + FloatingPetals2D matching SVGs 05 & 06 */}
        <View style={styles.backdropLayer} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(245, 195, 201, 0.44)',
              'rgba(244, 127, 114, 0.14)',
              'rgba(255, 247, 253, 0)',
            ]}
            locations={[0, 0.42, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topGradientWash}
          />
          <FloatingPetals2D />
        </View>

        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backHitArea,
              pressed && styles.pressedFade,
            ]}
          >
            <View style={styles.backChevronFlip}>
              <Icon
                name="chevron-right"
                size={20}
                strokeColor={KITSUNE_COLORS.plumInk}
              />
            </View>
          </Pressable>

          <Text style={styles.topBarTitle} numberOfLines={1}>
            {title}
          </Text>

          <Pressable
            onPress={onPressInspector}
            accessibilityRole="button"
            accessibilityLabel="Open connection and demo settings"
            style={({ pressed }) => [
              styles.profileHitArea,
              pressed && styles.pressedFade,
            ]}
          >
            <View style={styles.profileCircle}>
              <Icon name="profile" size={16} strokeColor="#FFFFFF" />
              {hasWarningDot && <View style={styles.warningDot} />}
            </View>
          </Pressable>
        </View>

        {/* Keyboard-safe scrollable viewport */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {previewOverride !== 'auto' && (
              <Pressable
                onPress={onResetPreview}
                accessibilityRole="button"
                accessibilityLabel="Exit state preview and return to auto mode"
                style={styles.previewBanner}
              >
                <Icon
                  name="sparkles"
                  size={14}
                  strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
                />
                <Text style={styles.previewBannerText}>
                  Preview: {previewOverride.replace('_', ' ')} — Tap to return to Auto
                </Text>
              </Pressable>
            )}

            {availability.status === 'loading' && (
              <AuthFormSkeleton variant={skeletonVariant} />
            )}

            {availability.status === 'offline' && (
              <ServiceStateCard
                kind="offline"
                onRetry={onRetry}
                onContinueDemo={onContinueDemo}
                isRetrying={isRetrying}
              />
            )}

            {availability.status === 'server_error' && (
              <ServiceStateCard
                kind="server_error"
                onRetry={onRetry}
                onContinueDemo={onContinueDemo}
                isRetrying={isRetrying}
                customSubtitle={availability.detail}
              />
            )}

            {availability.status === 'ready' && children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    alignItems: 'center',
  },
  mobileFrame: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    position: 'relative',
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  backdropLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  topGradientWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 247, 252, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38, 19, 51, 0.04)',
    zIndex: 10,
  },
  backHitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  backChevronFlip: {
    transform: [{ rotate: '180deg' }],
  },
  topBarTitle: {
    fontSize: 17,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.2,
  },
  profileHitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A03F36',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...KITSUNE_SHADOWS.miruku,
  },
  warningDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    borderWidth: 1.5,
    borderColor: KITSUNE_COLORS.washiCream,
  },
  pressedFade: {
    opacity: 0.65,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    flexGrow: 1,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.35)',
    marginBottom: 12,
  },
  previewBannerText: {
    fontSize: 12,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'capitalize',
  },
})
