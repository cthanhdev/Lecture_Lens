import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import {
  AuthErrorBanner,
  AuthOrDivider,
  AuthScreenChrome,
  ConnectionInspectorModal,
  ForgotPasswordModal,
  TermsPrivacyModal,
  useAuthScreenState,
} from '../../components/auth'
import { FramedBrandLogo } from '../../components/onboarding/FramedBrandLogo'
import { Button } from '../../components/ui/button/Button'
import { Icon } from '../../components/ui/icons'
import { FormInputPill } from '../../components/ui/input/FormInputPill'
import {
  DEMO_CREDENTIALS,
  getAuthSeam,
  validateSignInForm,
  validateUniversityEmail,
  type LegalDocumentTab,
  type SignInFormErrors,
  type SocialAuthProvider,
} from '../../modules/auth'
import { buildAuthRoute } from '../../modules/resilience'
import { useAppNavigation } from '../../navigation'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../theme/tokens'

/**
 * Screen 05 — Auth - Sign In
 * Implements Kitsune Soft layout from docs/design-assets/screens/svg/05 - Auth - Sign In.svg
 * with Skeleton Screen loading, Offline / Server Error resilience, and persistent Mock/Spring Boot seam.
 */
export default function SignInScreen() {
  const nav = useAppNavigation()
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>()
  const auth = useAuthScreenState()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignInFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittingProvider, setSubmittingProvider] = useState<
    'email' | SocialAuthProvider | null
  >(null)

  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<LegalDocumentTab | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const isEmailValid = useMemo(
    () => email.trim().length > 0 && validateUniversityEmail(email).isValid,
    [email],
  )

  const rawReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo

  const handleSignIn = async () => {
    const validation = validateSignInForm({ email, password })
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setSubmitError(null)
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {})
      return
    }

    setFieldErrors({})
    setSubmitError(null)
    auth.setLastErrorCode(null)
    setSubmittingProvider('email')

    try {
      const response = await getAuthSeam().signIn({
        email: email.trim(),
        password,
      })

      if (response.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {})
        auth.navigateAfterAuth()
        return
      }

      if (response.errorCode === 'SERVER_UNREACHABLE') {
        auth.setLastErrorCode('SERVER_UNREACHABLE')
        return
      }

      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {})
      setSubmitError(
        response.message ?? 'Unable to sign in right now. Please try again.',
      )
    } finally {
      setSubmittingProvider(null)
    }
  }

  const handleSocialSignIn = async (provider: SocialAuthProvider) => {
    setFieldErrors({})
    setSubmitError(null)
    auth.setLastErrorCode(null)
    setSubmittingProvider(provider)

    try {
      const response = await getAuthSeam().signInWithProvider(provider)
      if (response.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {})
        auth.navigateAfterAuth()
        return
      }

      if (response.errorCode === 'SERVER_UNREACHABLE') {
        auth.setLastErrorCode('SERVER_UNREACHABLE')
        return
      }

      setSubmitError(
        response.message ?? 'Social sign-in could not be completed right now.',
      )
    } finally {
      setSubmittingProvider(null)
    }
  }

  const handleOpenCreateAccount = () => {
    nav.goTo(
      buildAuthRoute('/(auth)/create-account', {
        dir: 'forward',
        returnTo: rawReturnTo,
      }),
      { replace: true },
    )
  }

  const handleFillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email)
    setPassword(DEMO_CREDENTIALS.password)
    setFieldErrors({})
    setSubmitError(null)
  }

  return (
    <>
      <AuthScreenChrome
        title="Sign In"
        skeletonVariant="sign-in"
        availability={auth.availability}
        previewOverride={auth.previewOverride}
        transitionDirection={auth.transitionDirection}
        isRetrying={auth.isRetrying}
        onPressBack={() => nav.goBack()}
        onResetPreview={() => auth.setPreviewOverride('auto')}
        onRetry={auth.handleRetry}
        onContinueDemo={auth.handleContinueInDemo}
      >
        <View style={styles.heroBlock}>
          <Pressable
            onLongPress={() => setInspectorOpen(true)}
            delayLongPress={450}
            accessibilityRole="imagebutton"
            accessibilityLabel="LectureLens Kitsune mascot"
          >
            <FramedBrandLogo variant="auth" />
          </Pressable>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSubtitle}>
            Pick up your lectures where you left off.
          </Text>
        </View>

        <View style={styles.formCard}>
          <AuthErrorBanner message={submitError} />

          <FormInputPill
            label="University email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setFieldErrors((prev) => ({ ...prev, email: undefined }))
              setSubmitError(null)
            }}
            placeholder={DEMO_CREDENTIALS.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
            leftIcon={
              <Icon
                name="mail"
                size={16}
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
            }
            leftIconBadgeTone="coral"
            isValid={isEmailValid}
            validBadgeTone="coral"
            surfaceTone="glass"
            error={fieldErrors.email}
            containerStyle={styles.fieldGap}
          />

          <FormInputPill
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              setFieldErrors((prev) => ({ ...prev, password: undefined }))
              setSubmitError(null)
            }}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            leftIcon={
              <Icon name="lock" size={16} strokeColor={KITSUNE_COLORS.plumInk} />
            }
            leftIconBadgeTone="sakura"
            surfaceTone="tint"
            rightIcon={
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  strokeColor={KITSUNE_COLORS.plumInkMuted}
                />
              </Pressable>
            }
            error={fieldErrors.password}
          />

          <View style={styles.forgotRow}>
            <Pressable
              onPress={() => setForgotModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              style={({ pressed }) => [
                styles.forgotButton,
                pressed && styles.pressedLink,
              ]}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submittingProvider === 'email'}
            disabled={submittingProvider !== null}
            rightIcon={<Icon name="arrow-right" size={18} strokeColor="#FFFFFF" />}
            onPress={handleSignIn}
          >
            Sign in
          </Button>
        </View>

        <AuthOrDivider />

        <View style={styles.socialStack}>
          <Button
            variant="dark"
            size="lg"
            fullWidth
            isLoading={submittingProvider === 'apple'}
            disabled={submittingProvider !== null}
            leftIcon={<Icon name="apple" size={18} strokeColor="#FFFFFF" />}
            onPress={() => handleSocialSignIn('apple')}
          >
            Continue with Apple
          </Button>

          <Button
            variant="surface"
            size="lg"
            fullWidth
            isLoading={submittingProvider === 'google'}
            disabled={submittingProvider !== null}
            leftIcon={<Icon name="google" size={18} />}
            onPress={() => handleSocialSignIn('google')}
          >
            Continue with Google
          </Button>
        </View>

        <View style={styles.footerBlock}>
          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>New to Kitsune?</Text>
            <Pressable
              onPress={handleOpenCreateAccount}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              style={({ pressed }) => [pressed && styles.pressedLink]}
            >
              <Text style={styles.switchAction}>Create account</Text>
            </Pressable>
          </View>

          <Text style={styles.legalText}>
            By continuing you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => setLegalTab('terms')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => setLegalTab('privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </AuthScreenChrome>

      <ForgotPasswordModal
        visible={forgotModalOpen}
        initialEmail={email}
        onClose={() => setForgotModalOpen(false)}
      />

      <TermsPrivacyModal
        visible={legalTab !== null}
        initialTab={legalTab ?? 'terms'}
        onClose={() => setLegalTab(null)}
      />

      <ConnectionInspectorModal
        visible={inspectorOpen}
        isOnline={auth.isOnline}
        authMode={auth.authMode}
        gatewayUrl={auth.gatewayUrl}
        previewOverride={auth.previewOverride}
        onChangePreviewOverride={auth.setPreviewOverride}
        onChangeAuthMode={auth.changeAuthMode}
        onFillDemoCredentials={handleFillDemo}
        onTriggerSkeletonCheck={() => auth.replaySkeleton(900)}
        onClose={() => setInspectorOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  heroBlock: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 26,
    lineHeight: 32,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.80)',
    borderRadius: KITSUNE_RADII.squircleCard,
    borderWidth: 1.5,
    borderColor: KITSUNE_COLORS.mirukuBorder,
    padding: 20,
    ...KITSUNE_SHADOWS.miruku,
  },
  fieldGap: {
    marginBottom: 14,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 14,
  },
  forgotButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 12.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  socialStack: {
    gap: 10,
  },
  footerBlock: {
    marginTop: 18,
    alignItems: 'center',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
  },
  switchPrompt: {
    fontSize: 13.5,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  switchAction: {
    fontSize: 13.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  legalText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_400Regular',
    textAlign: 'center',
  },
  legalLink: {
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textDecorationLine: 'underline',
  },
  pressedLink: {
    opacity: 0.65,
  },
})
