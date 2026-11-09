import { motion } from 'framer-motion'
import { KitsuneSakuraCanvas } from '../../components/canvas/KitsuneSakuraCanvas.tsx'
import { useSplashBoot } from './useSplashBoot.ts'
import kitsuneMascot from '../../assets/kitsune-mascot.png'

export function SplashView() {
  const { progress, skip } = useSplashBoot(2200)

  return (
    <div
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') skip()
      }}
      className="relative h-full min-h-full w-full bg-[#FFF7FD] flex flex-col justify-between items-center px-6 py-8 overflow-hidden select-none cursor-pointer"
      title="Chạm để bắt đầu"
    >
      {/* 1. Nền ánh sáng hữu cơ (Ambient Soft Mesh) */}
      <div className="absolute top-[-10%] left-[-10%] w-[320px] h-[320px] rounded-full bg-[#F47F72]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[360px] h-[360px] rounded-full bg-[#A9D4E8]/25 blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[240px] h-[240px] rounded-full bg-[#F5C3C9]/30 blur-2xl pointer-events-none" />

      {/* 2. 3D WebGL Canvas: Vòng hào quang thần thoại & cánh hoa rơi */}
      <KitsuneSakuraCanvas mode="splash" petalCount={28} interactive={true} />

      {/* 3. Khoảng trống phía trên */}
      <div className="h-6" />

      {/* 4. Trung tâm Hero: Linh vật Cáo Kitsune & Thương hiệu */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        {/* Khung Bento Squircle kính mờ bọc linh vật Pixel Art */}
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.1 }}
          className="relative group"
        >
          {/* Bóng đổ ấm màu mận chín & san hô (Plum/Coral Ambient Shadow) */}
          <div className="absolute -inset-1.5 rounded-[40px] bg-gradient-to-tr from-[#F47F72]/30 via-[#F5C3C9]/20 to-[#FFE27A]/30 blur-xl opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* Khối Squircle kính sữa Miruku Glass */}
          <div className="relative w-[156px] h-[156px] rounded-[36px] bg-white/90 backdrop-blur-md border border-white/95 p-3.5 shadow-xl shadow-[#F47F72]/15 flex items-center justify-center">
            <img
              src={kitsuneMascot}
              alt="Linh vật Cáo Kitsune đồng hành"
              className="w-full h-full object-contain rounded-[24px]"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </motion.div>

        {/* Tiêu đề thương hiệu & Châm ngôn */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 space-y-2"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#261333] tracking-tight">
            LectureLens
          </h1>
          <p className="text-[#56423F] text-base sm:text-lg font-medium">
            Your lectures, searchable.
          </p>
        </motion.div>
      </div>

      {/* 5. Chân trang: Thanh tiến độ Pill & Thông báo khởi động */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[240px]"
      >
        {/* Thanh tiến độ Pill viên thuốc */}
        <div className="w-[124px] h-2 bg-[#261333]/8 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#F47F72] to-[#A9D4E8] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-xs font-semibold tracking-wide text-[#56423F]/75">
          Getting things ready...
        </span>
      </motion.div>
    </div>
  )
}
