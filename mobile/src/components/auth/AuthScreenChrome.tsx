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
import type {
  AuthTransitionDirection,
  PreviewOverrideState,
  ServiceAvailability,
} from '../../modules/resilience'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'
import { AuthFormSkeleton, ServiceStateCard } from '../ui/feedback'
import { Icon } from '../ui/icons'
import { AuthAmbientBackdrop } from './AuthAmbientBackdrop'
import { AuthTransitionStage } from './AuthTransitionStage'

export interface AuthScreenChromeProps {
  title: string
  skeletonVariant: 'sign-in' | 'create-account'
  availability: ServiceAvailability
  previewOverride: PreviewOverrideState
  transitionDirection?: AuthTransitionDirection
  isRetrying: boolean
  embeddedBackdrop?: boolean
  onPressBack: () => void
  onResetPreview: () => void
  onRetry: () => void
  onContinueDemo: () => void
  children: React.ReactNode
}

/**
 * Shared mobile frame chrome for Screens 05 & 06:
 * - Seamless transparent borderless header (< back, centered title) blended directly into the Sakura top wash
 * - Zero top-right user icon on Auth or Skeleton/Resilience screens
 * - Smooth synchronized Reanimated directional transition stage
 * - Automatic Skeleton / No Internet / Server Error fallback rendering
 */
export const AuthScreenChrome: React.FC<AuthScreenChromeProps> = ({
  title,
  skeletonVariant,
  availability,
  previewOverride,
  transitionDirection = 'neutral',
  isRetrying,
  embeddedBackdrop = true,
  onPressBack,
  onResetPreview,
  onRetry,
  onContinueDemo,
  children,
}) => {
  const { width } = useWindowDimensions()
  const frameWidth = width <= 440 ? width : 390

  return (
    <SafeAreaView
      style={[styles.root, embeddedBackdrop && styles.rootTransparent]}
      edges={['top', 'bottom']}
    >
      <View
        style={[
          styles.mobileFrame,
          { width: frameWidth },
          embeddedBackdrop && styles.rootTransparent,
        ]}
      >
        {!embeddedBackdrop && (
          <AuthAmbientBackdrop
            frameWidth={frameWidth}
            staticStep={skeletonVariant === 'create-account' ? 1 : 0}
          />
        )}

        {/* Seamless transparent top bar aligned directly on top of the Sakura gradient wash */}
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

          <View style={styles.headerBalanceSpacer} />
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

            {availability.status === 'ready' && (
              <AuthTransitionStage
                direction={transitionDirection}
                transitionKey={skeletonVariant}
              >
                {children}
              </AuthTransitionStage>
            )}
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
  rootTransparent: {
    backgroundColor: 'transparent',
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
  topBar: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
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
  headerBalanceSpacer: {
    width: 44,
    height: 44,
  },
  pressedFade: {
    opacity: 0.65,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
