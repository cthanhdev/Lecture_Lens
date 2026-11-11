import type { PasswordStrength } from '../domain/auth.types.ts'

interface PasswordStrengthBarProps {
  strength: PasswordStrength
}

export function PasswordStrengthBar({ strength }: PasswordStrengthBarProps) {
  const { score, level, label, feedback } = strength

  // Màu sắc của các nấc theo chuẩn Kitsune Soft
  const getSegmentColor = (index: number) => {
    if (score === 0) return 'bg-[#261333]/10'

    if (index <= score) {
      if (level === 'weak') return 'bg-[#F47F72]' // Coral
      if (level === 'fair') return 'bg-[#A9D4E8]' // Mist Sky
      return 'bg-[#4EA87D]' // Matcha green
    }

    return 'bg-[#261333]/10'
  }

  const getTextColor = () => {
    if (level === 'weak') return 'text-[#A03F36]'
    if (level === 'fair') return 'text-[#2B6CB0]'
    return 'text-[#236E4D]'
  }

  return (
    <div className="w-full flex flex-col gap-1.5 mt-2 px-1">
      {/* 3 thanh phân đoạn bo tròn viên thuốc */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <div
          className={`h-1.5 rounded-full transition-colors duration-300 ${getSegmentColor(1)}`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-300 ${getSegmentColor(2)}`}
        />
        <div
          className={`h-1.5 rounded-full transition-colors duration-300 ${getSegmentColor(3)}`}
        />
      </div>

      {/* Dòng trạng thái: Chấm tròn + Nhãn + Gợi ý */}
      <div className="flex items-center justify-between text-xs mt-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-base leading-none font-bold ${getTextColor()}`}>
            •
          </span>
          <span className={`font-bold ${getTextColor()}`}>
            {label}
          </span>
        </div>
        <span className="text-[11px] text-[#56423F]/75 font-medium">
          {feedback}
        </span>
      </div>
    </div>
  )
}
