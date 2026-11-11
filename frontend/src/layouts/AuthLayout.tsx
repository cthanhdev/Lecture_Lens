import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { FloatingPetalsCanvas } from '../modules/auth/components/3d/FloatingPetalsCanvas.tsx'

export function AuthLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#FFF7FD] text-[#261333] flex flex-col justify-center items-center px-2 py-4 sm:py-8 relative overflow-x-hidden selection:bg-[#F5C3C9] selection:text-[#261333]">
      {/* 1. Tầng Three.js 3D Cánh hoa rơi tương tác (Canvas z-0) */}
      <FloatingPetalsCanvas />

      {/* 2. Soft Blobs tĩnh bổ trợ ánh sáng */}
      <div className="absolute top-8 -left-12 w-80 h-80 rounded-full bg-[#FDCBD1]/35 blur-3xl pointer-events-none" />
      <div className="absolute top-20 -right-16 w-80 h-80 rounded-full bg-[#F47F72]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-[#FFE27A]/20 blur-3xl pointer-events-none" />

      {/* 3. Vỏ mô phỏng Điện thoại Di động (Mobile Container Shell theo AGENTS.md) */}
      <div className="w-full max-w-[412px] mx-auto relative z-10 min-h-[844px] flex flex-col justify-between p-4 sm:p-5 rounded-[44px] sm:border sm:border-white/80 sm:shadow-2xl sm:shadow-[#261333]/10 bg-[#FFF7FD]/60 backdrop-blur-xs">
        <main className="w-full flex-1 flex flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <div key={location.pathname} className="w-full">
              <Outlet />
            </div>
          </AnimatePresence>
        </main>

        {/* Thanh Home Indicator chuẩn điện thoại di động */}
        <div className="w-full flex justify-center pt-2 pb-1 pointer-events-none">
          <div className="w-32 h-1 rounded-full bg-[#1F1A21]/20" />
        </div>
      </div>
    </div>
  )
}
