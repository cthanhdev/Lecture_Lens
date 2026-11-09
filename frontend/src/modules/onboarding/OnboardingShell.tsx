import React, { useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppNavigation } from '../../router/useAppNavigation.ts'
import { Button } from '../../components/ui/button/Button.tsx'
import { Icon } from '../../components/ui/icons/index.tsx'
import { KitsuneSakuraCanvas } from '../../components/canvas/KitsuneSakuraCanvas.tsx'
import { OnboardingDotIndicator } from './OnboardingDotIndicator.tsx'

export interface OnboardingShellProps {
  currentStep: 1 | 2 | 3
  badgeLabel?: string
  badgeVariant?: 'sakura' | 'mist' | 'mochi'
  heroVisual: React.ReactNode
  title: string
  description: string
  subContent?: React.ReactNode
  onNext?: () => void
  nextLabel?: string
}

export function OnboardingShell({
  currentStep,
  badgeLabel,
  badgeVariant = 'sakura',
  heroVisual,
  title,
  description,
  subContent,
  onNext,
  nextLabel,
}: OnboardingShellProps) {
  const nav = useAppNavigation()

  const handleSkip = useCallback(() => {
    localStorage.setItem('lecturelens_onboarding_completed', 'true')
    nav.goTo('/auth/sign-in')
  }, [nav])

  const handleNext = useCallback(() => {
    if (onNext) {
      onNext()
      return
    }
    if (currentStep === 1) {
      nav.goTo('/onboarding/step-2')
    } else if (currentStep === 2) {
      nav.goTo('/onboarding/step-3')
    } else {
      localStorage.setItem('lecturelens_onboarding_completed', 'true')
      nav.goTo('/auth/sign-in')
    }
  }, [currentStep, nav, onNext])

  // Điều hướng bằng phím mũi tên (ArrowLeft / ArrowRight / Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft' && currentStep > 1) {
        if (currentStep === 2) nav.goTo('/onboarding/step-1')
        if (currentStep === 3) nav.goTo('/onboarding/step-2')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, handleNext, nav])

  const badgeBgMap = {
    sakura: 'bg-[#FDE8EB] text-[#E06557]',
    mist: 'bg-[#EBF5FB] text-[#2D7393]',
    mochi: 'bg-[#FFF9E6] text-[#A67C00]',
  }

  const defaultNextLabel = currentStep === 3 ? 'Get started' : 'Continue'

  return (
    <div className="relative h-full min-h-full w-full bg-[#FFF7FD] text-[#261333] flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. Nền hoa anh đào 3D WebGL tương tác */}
      <KitsuneSakuraCanvas mode="onboarding" petalCount={22} interactive={true} />

      {/* 2. Đốm màu ánh sáng mềm (Soft Mesh) */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-[#F47F72]/15 blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[260px] h-[260px] rounded-full bg-[#FDCBD1]/25 blur-3xl pointer-events-none" />
      <div className="absolute top-[15%] left-[-10%] w-[240px] h-[240px] rounded-full bg-[#A2CDE1]/25 blur-3xl pointer-events-none" />

      {/* 3. Thanh điều hướng trên cùng (Top Bar) */}
      <header className="relative z-10 w-full max-w-md mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        {badgeLabel ? (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${badgeBgMap[badgeVariant]}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{badgeLabel}</span>
          </div>
        ) : (
          <div className="w-4" />
        )}

        <button
          type="button"
          onClick={handleSkip}
          className="text-sm font-semibold text-[#56423F] hover:text-[#261333] transition-colors py-1.5 px-3 rounded-full hover:bg-white/60 active:scale-95 cursor-pointer mochi-press"
        >
          Skip
        </button>
      </header>

      {/* 4. Nội dung chính có chuyển động trượt mượt mà (Animated Slide) */}
      <motion.main
        key={currentStep}
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -28 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative z-10 flex-1 w-full max-w-md mx-auto px-6 flex flex-col justify-center items-center py-4"
      >
        {/* Khu vực Hero Visual (3D Tilt & Miruku Glass Cards) */}
        <div className="w-full flex flex-col items-center justify-center min-h-[290px] mb-6">
          {heroVisual}
        </div>

        {/* Tiêu đề & Diễn giải */}
        <div className="text-center w-full space-y-3 px-2">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#261333] leading-snug tracking-tight">
            {title}
          </h2>
          <p className="text-[#56423F] text-sm sm:text-base font-normal leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Khối con bổ sung (Bento previews) */}
        {subContent && <div className="w-full mt-5">{subContent}</div>}
      </motion.main>

      {/* 5. Chân trang cố định: Chấm phân trang & Nút hành động chính */}
      <footer className="relative z-10 w-full max-w-md mx-auto px-6 pb-8 pt-2 flex flex-col items-center gap-4">
        {/* Bộ chấm phân trang biến hình (Morphing Dot Indicator) */}
        <OnboardingDotIndicator currentStep={currentStep} />

        {/* Nút hành động chính Pill */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleNext}
          rightIcon={currentStep < 3 ? <Icon name="arrow-right" size="sm" /> : undefined}
          className="w-full text-base font-bold shadow-lg shadow-[#F47F72]/30 active:scale-[0.98]"
        >
          {nextLabel || defaultNextLabel}
        </Button>
      </footer>
    </div>
  )
}
