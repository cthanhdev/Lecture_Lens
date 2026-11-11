import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../../../components/ui/icons/Icon.tsx'
import { Button } from '../../../components/ui/button/Button.tsx'
import { FormInputPill } from '../components/FormInputPill.tsx'
import { SocialLoginGroup } from '../components/SocialLoginGroup.tsx'
import { MascotAvatar } from '../components/MascotAvatar.tsx'
import { BackendStatusBanner } from '../components/BackendStatusBanner.tsx'
import { AuthSkeletonView } from '../components/AuthSkeletonView.tsx'
import { useBackendHealth } from '../infrastructure/networkMonitor.ts'
import { getAuthSeam } from '../infrastructure/authSeam.ts'
import { validateUniversityEmail, validatePassword } from '../domain/validation.ts'
import { useAppNavigation } from '../../../router/useAppNavigation.ts'

export function SignInPage() {
  const nav = useAppNavigation()
  const [email, setEmail] = useState('minh.tran@university.edu')
  const [password, setPassword] = useState('KitsuneSecret99')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [passwordError, setPasswordError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const {
    connectionState,
    checkNow,
    isSimulatedLoading,
    toggleSimulatedLoading,
  } = useBackendHealth()

  const isEmailValid = validateUniversityEmail(email).isValid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailCheck = validateUniversityEmail(email)
    const passCheck = validatePassword(password)

    if (!emailCheck.isValid) {
      setEmailError(emailCheck.message)
      return
    }
    setEmailError(undefined)

    if (!passCheck.isValid) {
      setPasswordError(passCheck.message)
      return
    }
    setPasswordError(undefined)

    setIsSubmitting(true)
    try {
      const res = await getAuthSeam().signIn({ email, password })
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
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
          Sign In
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
        <AuthSkeletonView mode="signin" />
      ) : (
        <>
          {/* 3. Header: Avatar Cáo Kitsune & Tiêu đề */}
          <MascotAvatar />

          <h2 className="text-2xl font-extrabold text-[#261333] tracking-tight mb-1 text-center">
            Welcome back
          </h2>
          <p className="text-xs text-[#56423F]/85 font-medium mb-6 text-center">
            Pick up your lectures where you left off.
          </p>

          {/* 4. Thẻ Form Kính Sữa Miruku Glass */}
          <div className="w-full rounded-[28px] miruku-glass p-6 md:p-7 border border-white/90 shadow-xl shadow-[#261333]/5 relative overflow-hidden">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Ô Email */}
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

              {/* Ô Mật khẩu */}
              <div className="flex flex-col">
                <FormInputPill
                  label="Password"
                  type="password"
                  leftIcon="lock"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(undefined)
                  }}
                  error={passwordError}
                />

                <div className="text-right mt-1.5 mr-1">
                  <a
                    href="#forgot-password"
                    className="text-xs font-bold text-[#A03F36] hover:text-[#F47F72] transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Nút Đăng nhập CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<Icon name="arrow-right" size="sm" />}
                className="w-full mt-2"
              >
                Sign in
              </Button>
            </form>

            {/* Đăng nhập Apple / Google */}
            <SocialLoginGroup
              mode="signin"
              onSocialLogin={() => {
                nav.goTo('/home')
              }}
            />
          </div>

          {/* 5. Chân trang (Footer) */}
          <footer className="mt-6 mb-8 text-center text-xs text-[#56423F]">
            <p className="mb-2">
              New to Kitsune?{' '}
              <button
                type="button"
                onClick={() => nav.goTo('/auth/create-account')}
                className="font-extrabold text-[#A03F36] hover:text-[#F47F72] transition-colors cursor-pointer"
              >
                Create account
              </button>
            </p>

            <p className="text-[11px] text-[#56423F]/65">
              By continuing you agree to our{' '}
              <a href="#terms" className="underline hover:text-[#261333]">
                Terms
              </a>{' '}
              and{' '}
              <a href="#privacy" className="underline hover:text-[#261333]">
                Privacy Policy
              </a>
              .
            </p>
          </footer>
        </>
      )}
    </motion.div>
  )
}
