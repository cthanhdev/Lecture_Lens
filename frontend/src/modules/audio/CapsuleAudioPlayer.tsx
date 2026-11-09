import { motion, AnimatePresence } from 'framer-motion'
import { PlayIcon, PauseIcon, HeadphonesIcon } from '../../components/ui/icons/index.tsx'
import { useAudioPlayer } from './useAudioPlayer.ts'
import { useAppNavigation } from '../../router/useAppNavigation.ts'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function CapsuleAudioPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, playbackRate, setRate } = useAudioPlayer()
  const nav = useAppNavigation()

  // Ẩn player nếu không có bài giảng hoặc đang ở màn hình ghi âm / làm bài kiểm tra
  if (!currentTrack || nav.currentRoute === '/audio/record' || nav.currentRoute.startsWith('/review/session/')) {
    return null
  }

  // Nếu đang ở màn hình Audio Detail thì Capsule thu nhỏ hoặc ẩn vì trang đã có player lớn
  const isInsideAudioDetail = nav.currentRoute.startsWith('/lectures/')

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleRateCycle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rates = [1.0, 1.25, 1.5, 2.0]
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length
    setRate(rates[nextIdx])
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={() => {
          if (!isInsideAudioDetail) {
            nav.goTo(`/lectures/${currentTrack.id}/transcript`)
          }
        }}
        className="cursor-pointer max-w-md mx-auto rounded-full miruku-glass-elevated border border-white/95 px-3 py-2 flex items-center justify-between gap-3 shadow-lg mochi-press relative overflow-hidden"
      >
        {/* Progress bar line ở đáy viên thuốc */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-[#F47F72]/60 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Cụm Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#F47F72]/15 text-[#F47F72] flex items-center justify-center shrink-0">
            <HeadphonesIcon size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#261333] truncate leading-tight">
              {currentTrack.title}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#56423F] font-mono">
              <span className="text-[#A03F36] font-semibold">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Nút Điều Khiển */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Nút tốc độ */}
          <button
            type="button"
            onClick={handleRateCycle}
            className="px-2 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-[10px] font-bold text-[#56423F] transition-colors"
          >
            {playbackRate}x
          </button>

          {/* Nút Play / Pause */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
            className="w-8 h-8 rounded-full bg-[#F47F72] hover:bg-[#A03F36] text-white flex items-center justify-center shadow-xs transition-colors mochi-press"
          >
            {isPlaying ? (
              <PauseIcon size="xs" />
            ) : (
              <PlayIcon size="xs" className="ml-0.5" />
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
