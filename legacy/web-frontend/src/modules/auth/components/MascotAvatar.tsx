import kitsuneMascot from '../../../assets/kitsune-mascot.png'

interface MascotAvatarProps {
  className?: string
}

/**
 * MascotAvatar: Thẻ linh vật Cáo Kitsune Pixel Art chính thức
 * Chuẩn tỷ lệ 96px x 96px (rx=28px) và ảnh trong 72px x 72px (rx=20px) theo SVG 05 & 06
 */
export function MascotAvatar({ className = '' }: MascotAvatarProps) {
  return (
    <div
      className={`w-24 h-24 rounded-[28px] miruku-glass border border-white/90 shadow-md shadow-[#261333]/5 mb-5 mx-auto flex items-center justify-center relative overflow-hidden select-none group ${className}`}
    >
      {/* Lớp ánh sáng nền dịu */}
      <div className="absolute inset-2 rounded-[22px] bg-gradient-to-tr from-[#F5C3C9]/35 via-white/60 to-[#FFE27A]/25 pointer-events-none" />

      {/* Khung chứa ảnh logo 72x72 chuẩn mực */}
      <div className="w-[72px] h-[72px] rounded-[20px] overflow-hidden relative z-10 flex items-center justify-center bg-white/95 shadow-xs border border-white/70 transition-transform duration-300 group-hover:scale-105">
        <img
          src={kitsuneMascot}
          alt="LectureLens Kitsune Fox Companion"
          className="w-full h-full object-contain p-1"
          loading="eager"
        />
      </div>
    </div>
  )
}
