import { motion } from 'framer-motion'
import { OnboardingShell } from './OnboardingShell.tsx'
import { Icon } from '../../components/ui/icons/index.tsx'
import kitsuneMascot from '../../assets/kitsune-mascot.png'

export function Step1AudioLectures() {
  const heroVisual = (
    <div className="relative flex flex-col items-center">
      {/* Khung Bento Squircle chứa linh vật Cáo Pixel Art */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative"
      >
        {/* Hào quang nền xanh ngọc dịu & sakura */}
        <div className="absolute -inset-4 rounded-[44px] bg-gradient-to-tr from-[#A2CDE1]/30 via-[#FDCBD1]/25 to-[#F47F72]/20 blur-xl" />

        {/* Thẻ kính sữa Miruku Glass */}
        <div className="relative w-[184px] h-[184px] rounded-[36px] bg-white/85 backdrop-blur-md border border-white/95 p-3 shadow-xl shadow-[#261333]/06 flex items-center justify-center">
          {/* Huy hiệu tia sáng góc trên */}
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#FFF9E6] border border-[#FFE27A]/40 flex items-center justify-center shadow-xs">
            <Icon name="sparkles" size="xs" className="text-[#E06557]" />
          </div>

          <img
            src={kitsuneMascot}
            alt="Linh vật Cáo Kitsune"
            className="w-full h-full object-contain rounded-[24px]"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </motion.div>

      {/* Pill Badge giới thiệu bước: Step 1 of 3 · Audio & Lectures */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#261333]/10 text-xs font-semibold text-[#261333] shadow-xs"
      >
        <Icon name="mic" size="xs" className="text-[#E06557]" />
        <span>Step 1 of 3 · Audio & Lectures</span>
      </motion.div>
    </div>
  )

  const subContent = (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Thẻ 1: Live Voice */}
      <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#261333]/08 flex items-center gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-full bg-[#FDE8EB] flex items-center justify-center shrink-0">
          <Icon name="mic" size="sm" className="text-[#E06557]" />
        </div>
        <div className="text-left overflow-hidden">
          <h4 className="text-xs font-bold text-[#261333] truncate">Live Voice</h4>
          <p className="text-[11px] text-[#56423F] truncate">Instant capture</p>
        </div>
      </div>

      {/* Thẻ 2: Import File */}
      <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#261333]/08 flex items-center gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-full bg-[#EBF5FB] flex items-center justify-center shrink-0">
          <Icon name="cloud-upload" size="sm" className="text-[#2D7393]" />
        </div>
        <div className="text-left overflow-hidden">
          <h4 className="text-xs font-bold text-[#261333] truncate">Import File</h4>
          <p className="text-[11px] text-[#56423F] truncate">MP3, M4A, WAV</p>
        </div>
      </div>
    </div>
  )

  return (
    <OnboardingShell
      currentStep={1}
      badgeLabel="Kitsune Note"
      badgeVariant="sakura"
      heroVisual={heroVisual}
      title="Turn every lecture into something you can search."
      description="Record in class or upload any audio. We'll transcribe and organize it for you."
      subContent={subContent}
    />
  )
}
