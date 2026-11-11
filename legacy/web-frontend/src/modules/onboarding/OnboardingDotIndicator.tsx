import { motion } from 'framer-motion'

export interface OnboardingDotIndicatorProps {
  totalSteps?: number
  currentStep: 1 | 2 | 3
}

export function OnboardingDotIndicator({
  totalSteps = 3,
  currentStep,
}: OnboardingDotIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2" role="tablist" aria-label="Tiến độ giới thiệu">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = (idx + 1) as 1 | 2 | 3
        const isActive = stepNum === currentStep

        return (
          <div
            key={stepNum}
            className="relative flex items-center justify-center"
            aria-selected={isActive}
            role="tab"
          >
            {isActive ? (
              <motion.div
                layoutId="active-onboarding-dot"
                className="h-2 w-7 rounded-full bg-[#F47F72] shadow-sm shadow-[#F47F72]/30"
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            ) : (
              <div className="h-2 w-2 rounded-full bg-[#261333]/18 transition-colors duration-200" />
            )}
          </div>
        )
      })}
    </div>
  )
}
