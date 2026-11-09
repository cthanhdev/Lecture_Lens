import { motion } from 'framer-motion'
import { OnboardingShell } from './OnboardingShell.tsx'
import { Icon } from '../../components/ui/icons/index.tsx'

export function Step2EffortlessClarity() {
  const heroVisual = (
    <div className="relative w-full max-w-[320px] h-[260px] flex items-center justify-center">
      {/* 1. Thẻ nền phía sau: Macro Seminar Audio Player Preview */}
      <motion.div
        initial={{ y: -8, scale: 0.95, opacity: 0 }}
        animate={{ y: -24, scale: 0.96, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        className="absolute top-4 left-2 right-6 p-4 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 shadow-md shadow-[#261333]/04 z-10"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F47F72] text-white flex items-center justify-center shadow-xs">
              <Icon name="play" size="xs" fill="currentColor" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#261333]">Macro Seminar</h4>
              <p className="text-[10px] text-[#56423F]">04:18 / 32:40</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FDE8EB] text-[#E06557] text-[10px] font-bold">
            Key Insight
          </span>
        </div>

        {/* Thanh sóng âm thanh tượng trưng */}
        <div className="flex items-end justify-between h-5 px-1 gap-1 opacity-70">
          {[6, 12, 18, 9, 14, 20, 16, 8, 12, 17, 10, 14, 8].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${i === 4 || i === 5 ? 'bg-[#F47F72]' : 'bg-[#261333]/20'}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </motion.div>

      {/* 2. Thẻ kính sữa xếp lớp phía trước: Auto-Extracted Notes */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 18, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 26 }}
        className="absolute bottom-4 left-6 right-2 p-4 rounded-3xl bg-white/90 backdrop-blur-lg border border-white/95 shadow-xl shadow-[#261333]/08 z-20 space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#261333]">
            <Icon name="sparkles" size="xs" className="text-[#F47F72]" />
            <span>Auto-Extracted Notes</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#EBF5FB] text-[#2D7393] text-[10px] font-bold tracking-wider">
            99.4% SYNC
          </span>
        </div>

        <p className="text-[11px] text-[#56423F] italic leading-tight">
          &ldquo;Looking closer at global consumer...&rdquo;
        </p>

        {/* Khối trích dẫn màu vàng Mochi nổi bật */}
        <div className="p-2.5 rounded-2xl bg-[#FFF9E6] border border-[#FFE27A]/60 text-left space-y-1 shadow-xs">
          <div className="flex items-start gap-1.5">
            <Icon name="star" size="xs" className="text-[#A67C00] shrink-0 mt-0.5" fill="#FFE27A" />
            <p className="text-[11px] font-bold text-[#261333] leading-snug">
              Central bank actions directly dictate liquidity cycles.
            </p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#56423F]/80 pl-4 font-medium">
            <span>Summary Bookmark</span>
            <span>04:22</span>
          </div>
        </div>
      </motion.div>

      {/* 3. Các chip từ khóa lơ lửng 3D (Floating Parallax Chips) */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 -left-1 z-30 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#261333]/08 text-[11px] font-semibold text-[#261333] shadow-md flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#F47F72]" />
        <span>#inflation</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-2 left-16 z-30 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#261333]/08 text-[11px] font-semibold text-[#261333] shadow-md flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#2D7393]" />
        <span>interest rate ↗</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-36 -right-1 z-30 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#261333]/08 text-[11px] font-semibold text-[#261333] shadow-md flex items-center gap-1.5"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#F5C3C9]" />
        <span>central bank</span>
      </motion.div>
    </div>
  )

  return (
    <OnboardingShell
      currentStep={2}
      badgeLabel="Step 02 of 03"
      badgeVariant="sakura"
      heroVisual={heroVisual}
      title="Highlights and summaries, done for you."
      description="Jump straight to the moments that matter and replay them."
    />
  )
}
