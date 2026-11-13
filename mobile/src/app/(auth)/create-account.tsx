import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import {
  AuthErrorBanner,
  AuthOrDivider,
  AuthScreenChrome,
  ConnectionInspectorModal,
  PasswordStrengthMeter,
  TermsPrivacyModal,
  useAuthScreenState,
} from '../../components/auth'
import { FramedBrandLogo } from '../../components/onboarding/FramedBrandLogo'
import { Button } from '../../components/ui/button/Button'
import { Icon } from '../../components/ui/icons'
import { FormInputPill } from '../../components/ui/input/FormInputPill'
import { KawaiiCheckbox } from '../../components/ui/input/KawaiiCheckbox'
import {
  getAuthSeam,
  validateRegistrationForm,
  validateUniversityEmail,
  type LegalDocumentTab,
  type RegistrationFormErrors,
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
 * Screen 06 — Auth - Create Account
 * Implements Kitsune Soft layout from docs/design-assets/screens/svg/06 - Auth - Create Account.svg
 * with live password entropy feedback, Skeleton Screen loading, Offline / Server Error resilience,
 * and persistent Mock/Spring Boot seam.
 */
export default function CreateAccountScreen() {
  const nav = useAppNavigation()
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>()
  const auth = useAuthScreenState()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegistrationFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittingProvider, setSubmittingProvider] = useState<
    'email' | SocialAuthProvider | null
  >(null)

  const [legalTab, setLegalTab] = useState<LegalDocumentTab | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const isEmailValid = useMemo(
    () => email.trim().length > 0 && validateUniversityEmail(email).isValid,
    [email],
  )

  const rawReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo

  const handleCreateAccount = async () => {
    const validation = validateRegistrationForm({
      fullName,
      email,
      password,
      agreeTerms,
    })

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
      const response = await getAuthSeam().createAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        agreeTerms,
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
        response.message ??
          'Unable to create your account right now. Please try again.',
      )
    } finally {
      setSubmittingProvider(null)
    }
  }

  const handleSocialSignUp = async (provider: SocialAuthProvider) => {
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
        response.message ?? 'Social sign-up could not be completed right now.',
      )
    } finally {
      setSubmittingProvider(null)
    }
  }

  const handleOpenSignIn = () => {
    nav.goTo(
      buildAuthRoute('/(auth)/sign-in', {
        dir: 'back',
        returnTo: rawReturnTo,
      }),
      { replace: true },
    )
  }

  const handleFillSampleStudent = () => {
    setFullName('Linh Nguyen')
    setEmail('linh.nguyen@university.edu')
    setPassword('KitsuneSmart2025')
    setAgreeTerms(true)
    setFieldErrors({})
    setSubmitError(null)
  }

  return (
    <>
      <AuthScreenChrome
        title="Create Account"
        skeletonVariant="create-account"
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
          <Text style={styles.heroTitle}>Create your account</Text>
          <Text style={styles.heroSubtitle}>
            Turn every lecture into something you can search.
          </Text>
        </View>

        <View style={styles.formCard}>
          <AuthErrorBanner message={submitError} />

          <FormInputPill
            label="Full name"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text)
              setFieldErrors((prev) => ({ ...prev, fullName: undefined }))
              setSubmitError(null)
            }}
            placeholder="Minh Tran"
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
            returnKeyType="next"
            leftIcon={
              <Icon
                name="profile"
                size={16}
                strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
              />
            }
            leftIconBadgeTone="sakura"
            surfaceTone="tint"
            error={fieldErrors.fullName}
            containerStyle={styles.fieldGap}
          />

          <FormInputPill
            label="University email"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              setFieldErrors((prev) => ({ ...prev, email: undefined }))
              setSubmitError(null)
            }}
            placeholder="minh.tran@university.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            returnKeyType="next"
            leftIcon={
              <Icon name="mail" size={16} strokeColor={KITSUNE_COLORS.plumInk} />
            }
            leftIconBadgeTone="sky"
            isValid={isEmailValid}
            validBadgeTone="sky"
            surfaceTone="tint"
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
            placeholder="Create a strong password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleCreateAccount}
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

          <PasswordStrengthMeter password={password} />

          <View style={styles.termsBlock}>
            <KawaiiCheckbox
              checked={agreeTerms}
              onChange={(next) => {
                setAgreeTerms(next)
                setFieldErrors((prev) => ({
                  ...prev,
                  agreeTerms: undefined,
                }))
                setSubmitError(null)
              }}
              label={
                <Text style={styles.termsLabelText}>
                  I agree to the{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setLegalTab('terms')}
                  >
                    Terms
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setLegalTab('privacy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              }
            />
            {fieldErrors.agreeTerms ? (
              <Text style={styles.termsErrorText}>
                {fieldErrors.agreeTerms}
              </Text>
            ) : null}
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submittingProvider === 'email'}
            disabled={submittingProvider !== null}
            rightIcon={<Icon name="arrow-right" size={18} strokeColor="#FFFFFF" />}
            onPress={handleCreateAccount}
          >
            Create account
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
            onPress={() => handleSocialSignUp('apple')}
          >
            Sign up with Apple
          </Button>

          <Button
            variant="surface"
            size="lg"
            fullWidth
            isLoading={submittingProvider === 'google'}
            disabled={submittingProvider !== null}
            leftIcon={<Icon name="google" size={18} />}
            onPress={() => handleSocialSignUp('google')}
          >
            Sign up with Google
          </Button>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.switchPrompt}>Already have an account?</Text>
          <Pressable
            onPress={handleOpenSignIn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={({ pressed }) => [pressed && styles.pressedLink]}
          >
            <Text style={styles.switchAction}>Sign in</Text>
          </Pressable>
        </View>
      </AuthScreenChrome>

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
        onFillDemoCredentials={handleFillSampleStudent}
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
    marginBottom: 16,
  },
  heroTitle: {
    marginTop: 12,
    fontSize: 25,
    lineHeight: 31,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 4,
    maxWidth: 278,
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
    marginBottom: 12,
  },
  termsBlock: {
    marginTop: 14,
    marginBottom: 14,
  },
  termsLabelText: {
    fontSize: 13,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  termsLink: {
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  termsErrorText: {
    marginTop: 4,
    marginLeft: 32,
    fontSize: 12,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  socialStack: {
    gap: 10,
  },
  footerRow: {
    marginTop: 18,
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
  pressedLink: {
    opacity: 0.65,
  },
})
