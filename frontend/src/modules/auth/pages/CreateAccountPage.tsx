import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../../../components/ui/icons/Icon.tsx'
import { Button } from '../../../components/ui/button/Button.tsx'
import { FormInputPill } from '../components/FormInputPill.tsx'
import { PasswordStrengthBar } from '../components/PasswordStrengthBar.tsx'
import { KawaiiCheckbox } from '../components/KawaiiCheckbox.tsx'
import { SocialLoginGroup } from '../components/SocialLoginGroup.tsx'
import { MascotAvatar } from '../components/MascotAvatar.tsx'
import { BackendStatusBanner } from '../components/BackendStatusBanner.tsx'
import { AuthSkeletonView } from '../components/AuthSkeletonView.tsx'
import { useBackendHealth } from '../infrastructure/networkMonitor.ts'
import { getAuthSeam } from '../infrastructure/authSeam.ts'
import { calculatePasswordStrength } from '../domain/passwordEntropy.ts'
import {
  validateUniversityEmail,
  validateFullName,
  validatePassword,
} from '../domain/validation.ts'
import { useAppNavigation } from '../../../router/useAppNavigation.ts'

export function CreateAccountPage() {
  const nav = useAppNavigation()
  const [fullName, setFullName] = useState('Minh Tran')
  const [email, setEmail] = useState('minh.tran@university.edu')
  const [password, setPassword] = useState('KitsuneSmart2025')
  const [agreeTerms, setAgreeTerms] = useState(true)

  const [nameError, setNameError] = useState<string | undefined>()
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [termsError, setTermsError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const {
    connectionState,
    checkNow,
    isSimulatedLoading,
    toggleSimulatedLoading,
  } = useBackendHealth()

  const isEmailValid = validateUniversityEmail(email).isValid
  const passwordStrength = calculatePasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameCheck = validateFullName(fullName)
    const emailCheck = validateUniversityEmail(email)
    const passCheck = validatePassword(password)

    let hasError = false

    if (!nameCheck.isValid) {
      setNameError(nameCheck.message)
      hasError = true
    } else {
      setNameError(undefined)
    }

    if (!emailCheck.isValid) {
      setEmailError(emailCheck.message)
      hasError = true
    } else {
      setEmailError(undefined)
    }

    if (!passCheck.isValid) {
      setPasswordError(passCheck.message)
      hasError = true
    } else {
      setPasswordError(undefined)
    }

    if (!agreeTerms) {
      setTermsError('Vui lòng đồng ý với Điều khoản và Chính sách bảo mật.')
      hasError = true
    } else {
      setTermsError(undefined)
    }

    if (hasError) return

    setIsSubmitting(true)
    try {
      const res = await getAuthSeam().createAccount({
        fullName,
        email,
        password,
        agreeTerms,
      })
      if (res.success) {
        startTransition(() => {
          nav.goTo('/home')
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="w-full flex flex-col items-center select-none"
    >
      {/* 1. Thanh điều hướng đỉnh (Top Bar) */}
      <header className="w-full flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={() => nav.goBack()}
          aria-label="Quay lại"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#261333] hover:bg-white/60 active:scale-95 transition-all mochi-press cursor-pointer"
        >
          <Icon name="arrow-left" size="md" />
        </button>

        <h1 className="text-base font-extrabold text-[#261333] tracking-tight">
          Create Account
        </h1>

        <button
          type="button"
          aria-label="Hồ sơ tài khoản"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#261333] hover:bg-white/60 active:scale-95 transition-all mochi-press cursor-pointer"
        >
          <Icon name="profile" size="md" blob="coral" />
        </button>
      </header>

      {/* 2. Banner kiểm tra trạng thái Backend / Mạng */}
      <BackendStatusBanner
        connectionState={connectionState}
        onRetry={checkNow}
        isSimulatedLoading={isSimulatedLoading}
        onToggleSimulatedLoading={toggleSimulatedLoading}
      />

      {/* Hiển thị Skeleton nếu bật chế độ mô phỏng loading */}
      {isSimulatedLoading ? (
        <AuthSkeletonView mode="register" />
      ) : (
        <>
          {/* 3. Header: Avatar Cáo Kitsune & Tiêu đề */}
          <MascotAvatar />

          <h2 className="text-2xl font-extrabold text-[#261333] tracking-tight mb-1 text-center">
            Create your account
          </h2>
          <p className="text-xs text-[#56423F]/85 font-medium mb-6 text-center">
            Turn every lecture into something you can search.
          </p>

          {/* 4. Thẻ Form Kính Sữa Miruku Glass */}
          <div className="w-full rounded-[28px] miruku-glass p-6 md:p-7 border border-white/90 shadow-xl shadow-[#261333]/5 relative overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Họ và tên */}
              <FormInputPill
                label="Full name"
                type="text"
                leftIcon="profile"
                placeholder="Minh Tran"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (nameError) setNameError(undefined)
                }}
                error={nameError}
              />

              {/* Email trường */}
              <FormInputPill
                label="University email"
                type="email"
                leftIcon="mail"
                placeholder="minh.tran@university.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(undefined)
                }}
                showValidationCheck={isEmailValid}
                error={emailError}
              />

              {/* Mật khẩu & Thước đo độ mạnh */}
              <div className="flex flex-col">
                <FormInputPill
                  label="Password"
                  type="password"
                  leftIcon="lock"
                  placeholder="KitsuneSmart2025"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(undefined)
                  }}
                  error={passwordError}
                />

                <PasswordStrengthBar strength={passwordStrength} />
              </div>

              {/* Checkbox chấp thuận điều khoản */}
              <div className="mt-1">
                <KawaiiCheckbox
                  checked={agreeTerms}
                  onChange={(checked) => {
                    setAgreeTerms(checked)
                    if (termsError) setTermsError(undefined)
                  }}
                  error={termsError}
                />
              </div>

              {/* Nút Tạo tài khoản CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Icon name="arrow-right" size="sm" />}
                className="w-full mt-2"
              >
                Create account
              </Button>
            </form>

            {/* Đăng ký Apple / Google */}
            <SocialLoginGroup
              mode="register"
              onSocialLogin={() => {
                nav.goTo('/home')
              }}
            />
          </div>

          {/* 5. Chân trang (Footer) */}
          <footer className="mt-6 mb-8 text-center text-xs text-[#56423F]">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => nav.goTo('/auth/sign-in')}
                className="font-extrabold text-[#A03F36] hover:text-[#F47F72] transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </footer>
        </>
      )}
    </motion.div>
  )
}
