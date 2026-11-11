import { useState } from 'react'
import { motion } from 'framer-motion'
import { OnboardingShell } from './OnboardingShell.tsx'
import { Icon } from '../../components/ui/icons/index.tsx'

export function Step3ActiveRecall() {
  const [isPlayingClip, setIsPlayingClip] = useState(false)

  const heroVisual = (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="relative w-full max-w-[310px] p-5 rounded-[32px] bg-white/85 backdrop-blur-lg border border-white/95 shadow-xl shadow-[#261333]/08 text-left space-y-3.5"
    >
      {/* 1. Hàng thẻ phân loại trên cùng */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5FB] text-[#2D7393] text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D7393]" />
          <span>Macroeconomics</span>
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDE8EB] text-[#E06557] text-xs font-bold">
          <Icon name="flame" size="xs" className="text-[#E06557]" />
          <span>12-day streak</span>
        </span>
      </div>

      {/* 2. Câu hỏi thẻ Flashcard & Lời giải */}
      <div className="space-y-1.5 pt-1">
        <h3 className="text-base font-extrabold text-[#261333] leading-snug">
          What is cost-push inflation?
        </h3>
        <p className="text-xs text-[#56423F] font-normal leading-relaxed">
          Decreased aggregate supply driven by higher production costs.
        </p>
      </div>

      {/* 3. Capsule Audio Player: Replay 0:24 lecture clip */}
      <button
        type="button"
        onClick={() => setIsPlayingClip(!isPlayingClip)}
        className="w-full py-2.5 px-3.5 rounded-full bg-[#F47F72] text-white flex items-center justify-between shadow-md shadow-[#F47F72]/30 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer mochi-press"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white text-[#F47F72] flex items-center justify-center shrink-0">
            <Icon name={isPlayingClip ? 'pause' : 'play'} size="xs" fill="currentColor" />
          </div>
          <span className="text-xs font-bold tracking-tight">
            Replay 0:24 lecture clip
          </span>
        </div>

        {/* Thanh sóng âm thanh hoạt họa khi phát */}
        <div className="flex items-end gap-1 h-3.5 pr-1">
          {[4, 10, 14, 7].map((h, i) => (
            <div
              key={i}
              className={`w-0.5 rounded-full bg-white ${isPlayingClip ? 'animate-pulse' : 'opacity-80'}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </button>

      {/* 4. Thông tin Spaced Repetition dưới đáy thẻ */}
      <div className="flex items-center justify-between pt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#261333]/06 text-[#56423F] text-xs font-medium">
          <Icon name="clock" size="xs" />
          <span>Next: 4 days</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDE8EB] text-[#E06557] text-xs font-bold">
          <Icon name="check-circle" size="xs" className="text-[#E06557]" />
          <span>Mastered</span>
        </span>
      </div>
    </motion.div>
  )

  return (
    <OnboardingShell
      currentStep={3}
      heroVisual={heroVisual}
      title="Flashcards that play the original lecture."
      description="Review at the right time and actually remember."
      nextLabel="Get started"
    />
  )
}
