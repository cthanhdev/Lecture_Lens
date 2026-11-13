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
  getAuthSeam,
  validateRegistrationForm,
  validateUniversityEmail,
  type AuthErrorCode,
  type LegalDocumentTab,
  type RegistrationFormErrors,
  type SocialAuthProvider,
} from '../../modules/auth'
import { KITSUNE_COLORS } from '../../theme/tokens'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons'
import { FormInputPill } from '../ui/input/FormInputPill'
import { KawaiiCheckbox } from '../ui/input/KawaiiCheckbox'
import { AuthErrorBanner, AuthOrDivider } from './AuthFormPrimitives'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import { AuthMascotHero, authPaneStyles } from './authPaneStyles'
import { useAuthSubmission } from './useAuthSubmission'

export interface CreateAccountPaneProps {
  width: number
  scrollProgress: SharedValue<number>
  fillDemoSignal: number
  onSwitchToSignIn: () => void
  onOpenLegal: (tab: LegalDocumentTab) => void
  onOpenInspector: () => void
  onAuthSuccess: () => void
  onServiceErrorCode: (code: AuthErrorCode | null) => void
}

/**
 * Screen 06 — Auth - Create Account pane hosted inside AuthCarousel.
 * Matches docs/design-assets/screens/svg/06 - Auth - Create Account.svg.
 */
export const CreateAccountPane: React.FC<CreateAccountPaneProps> = ({
  width,
  scrollProgress,
  fillDemoSignal,
  onSwitchToSignIn,
  onOpenLegal,
  onOpenInspector,
  onAuthSuccess,
  onServiceErrorCode,
}) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegistrationFormErrors>({})
  const handledSignalRef = useRef(fillDemoSignal)

  const { submitError, setSubmitError, submittingProvider, runSubmission } =
    useAuthSubmission({
      onSuccess: onAuthSuccess,
      onServiceErrorCode,
    })

  useEffect(() => {
    if (fillDemoSignal > handledSignalRef.current) {
      handledSignalRef.current = fillDemoSignal
      setFullName('Linh Nguyen')
      setEmail('linh.nguyen@university.edu')
      setPassword('KitsuneSmart2025')
      setAgreeTerms(true)
      setFieldErrors({})
      setSubmitError(null)
    }
  }, [fillDemoSignal, setSubmitError])

  const isEmailValid = useMemo(
    () => email.trim().length > 0 && validateUniversityEmail(email).isValid,
    [email]
  )

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
        Haptics.NotificationFeedbackType.Warning
      ).catch(() => {})
      return
    }

    setFieldErrors({})
    await runSubmission(
      'email',
      () =>
        getAuthSeam().createAccount({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          agreeTerms,
        }),
      'Unable to create your account right now. Please try again.'
    )
  }

  const handleSocialSignUp = async (provider: SocialAuthProvider) => {
    setFieldErrors({})
    await runSubmission(
      provider,
      () => getAuthSeam().signInWithProvider(provider),
      'Social sign-up could not be completed right now.'
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
          title="Create your account"
          subtitle="Turn every lecture into something you can search."
          pageIndex={1}
          scrollProgress={scrollProgress}
          onOpenInspector={onOpenInspector}
          compact
        />

        <View style={authPaneStyles.formCard}>
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
                    onPress={() => onOpenLegal('terms')}
                  >
                    Terms
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => onOpenLegal('privacy')}
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

        <View style={authPaneStyles.socialStack}>
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
          <Text style={authPaneStyles.switchPrompt}>Already have an account?</Text>
          <Pressable
            onPress={onSwitchToSignIn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={({ pressed }) => [pressed && authPaneStyles.pressedLink]}
          >
            <Text style={authPaneStyles.switchAction}>Sign in</Text>
          </Pressable>
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
  footerRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
  },
})
