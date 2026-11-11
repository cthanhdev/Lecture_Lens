// Kitsune Soft Timestamp Seek Chip [MM:SS]
import React from 'react'
import { clsx } from 'clsx'
import { PlayIcon } from '../icons/index.tsx'

export interface TimestampChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Thời gian tính bằng giây hoặc chuỗi đã format sẵn (vd: '04:12' hoặc 252) */
  time: number | string
  /** Trạng thái đang phát đoạn âm thanh này */
  isPlaying?: boolean
  /** Màu nhấn: matcha (mặc định cho bài học) hoặc mochi (cho highlight thi cử) */
  accent?: 'matcha' | 'mochi' | 'coral'
  /** Hàm callback khi click để tua audio */
  onSeek?: (seconds: number) => void
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function parseSeconds(val: number | string): { formatted: string; seconds: number } {
  if (typeof val === 'number') {
    return { formatted: formatSeconds(val), seconds: val }
  }
  // Nếu là dạng 'MM:SS'
  const parts = val.replace(/[[\]]/g, '').split(':')
  if (parts.length === 2) {
    const s = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
    return { formatted: val.replace(/[[\]]/g, ''), seconds: isNaN(s) ? 0 : s }
  }
  return { formatted: val, seconds: 0 }
}

export const TimestampChip: React.FC<TimestampChipProps> = ({
  time,
  isPlaying = false,
  accent = 'matcha',
  onSeek,
  className = '',
  onClick,
  ...props
}) => {
  const { formatted, seconds } = parseSeconds(time)

  const accentStyles: Record<string, string> = {
    matcha:
      'bg-[#BEE1D0]/35 text-[#0A4325] border border-[#BEE1D0] hover:bg-[#BEE1D0]/60',
    mochi:
      'bg-[#FFE27A]/35 text-[#7B5400] border border-[#FFE27A] hover:bg-[#FFE27A]/60',
    coral:
      'bg-[#F47F72]/20 text-[#A03F36] border border-[#F47F72]/30 hover:bg-[#F47F72]/30',
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onSeek) onSeek(seconds)
    if (onClick) onClick(e)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-tight transition-all duration-150 select-none cursor-pointer mochi-press',
        isPlaying
          ? 'bg-[#F47F72] text-white shadow-xs border-transparent'
          : accentStyles[accent],
        className
      )}
      title={`Nhấn để nghe tại ${formatted}`}
      {...props}
    >
      <PlayIcon size="xs" className={isPlaying ? 'text-white' : 'opacity-70'} />
      <span>[{formatted}]</span>
    </button>
  )
}
