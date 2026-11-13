import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import type { SharedValue } from 'react-native-reanimated'
import {
  DEMO_CREDENTIALS,
  getAuthSeam,
  validateSignInForm,
  validateUniversityEmail,
  type AuthErrorCode,
  type LegalDocumentTab,
  type SignInFormErrors,
  type SocialAuthProvider,
} from '../../modules/auth'
import { KITSUNE_COLORS } from '../../theme/tokens'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons'
import { FormInputPill } from '../ui/input/FormInputPill'
import { AuthErrorBanner, AuthOrDivider } from './AuthFormPrimitives'
import { AuthMascotHero, authPaneStyles } from './authPaneStyles'
import { useAuthSubmission } from './useAuthSubmission'

export interface SignInPaneProps {
  width: number
  scrollProgress: SharedValue<number>
  fillDemoSignal: number
  onSwitchToCreateAccount: () => void
  onOpenLegal: (tab: LegalDocumentTab) => void
  onOpenForgotPassword: (currentEmail: string) => void
  onOpenInspector: () => void
  onAuthSuccess: () => void
  onServiceErrorCode: (code: AuthErrorCode | null) => void
}

/**
 * Screen 05 — Auth - Sign In pane hosted inside AuthCarousel.
 * Matches docs/design-assets/screens/svg/05 - Auth - Sign In.svg.
 */
export const SignInPane: React.FC<SignInPaneProps> = ({
  width,
  scrollProgress,
  fillDemoSignal,
  onSwitchToCreateAccount,
  onOpenLegal,
  onOpenForgotPassword,
  onOpenInspector,
  onAuthSuccess,
  onServiceErrorCode,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignInFormErrors>({})
  const handledSignalRef = useRef(fillDemoSignal)

  const { submitError, setSubmitError, submittingProvider, runSubmission } =
    useAuthSubmission({
      onSuccess: onAuthSuccess,
      onServiceErrorCode,
    })

  useEffect(() => {
    if (fillDemoSignal > handledSignalRef.current) {
      handledSignalRef.current = fillDemoSignal
      setEmail(DEMO_CREDENTIALS.email)
      setPassword(DEMO_CREDENTIALS.password)
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [fillDemoSignal, setSubmitError])

  const isEmailValid = useMemo(
    () => email.trim().length > 0 && validateUniversityEmail(email).isValid,
    [email]
  )

  const handleSignIn = async () => {
    const validation = validateSignInForm({ email, password })
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setSubmitError(null)
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      ).catch(() => {})
      return
    }

    setFieldErrors({})
    await runSubmission(
      'email',
      () => getAuthSeam().signIn({ email: email.trim(), password }),
      'Unable to sign in right now. Please try again.'
    )
  }

  const handleSocialSignIn = async (provider: SocialAuthProvider) => {
    setFieldErrors({})
    await runSubmission(
      provider,
      () => getAuthSeam().signInWithProvider(provider),
      'Social sign-in could not be completed right now.'
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.slideRoot, { width }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={authPaneStyles.slideScrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <AuthMascotHero
          title="Welcome back"
          subtitle="Pick up your lectures where you left off."
          pageIndex={0}
          scrollProgress={scrollProgress}
          onOpenInspector={onOpenInspector}
        />

        <View style={authPaneStyles.formCard}>
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
              onPress={() => onOpenForgotPassword(email)}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              style={({ pressed }) => [
                styles.forgotButton,
                pressed && authPaneStyles.pressedLink,
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

        <View style={authPaneStyles.socialStack}>
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
          <View style={authPaneStyles.switchRow}>
            <Text style={authPaneStyles.switchPrompt}>New to Kitsune?</Text>
            <Pressable
              onPress={onSwitchToCreateAccount}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              style={({ pressed }) => [pressed && authPaneStyles.pressedLink]}
            >
              <Text style={authPaneStyles.switchAction}>Create account</Text>
            </Pressable>
          </View>

          <Text style={styles.legalText}>
            By continuing you agree to our{' '}
            <Text
              style={styles.legalLink}
              onPress={() => onOpenLegal('terms')}
            >
              Terms
            </Text>{' '}
            and{' '}
            <Text
              style={styles.legalLink}
              onPress={() => onOpenLegal('privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  slideRoot: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  footerBlock: {
    marginTop: 18,
    alignItems: 'center',
    gap: 10,
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
})
