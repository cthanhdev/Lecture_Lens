import React from 'react'
import { MobileStatusBar } from '../components/ui/mobile/MobileStatusBar.tsx'
import { HomeIndicator } from '../components/ui/mobile/HomeIndicator.tsx'

export interface MobileContainerProps {
  children: React.ReactNode
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="min-h-screen w-full bg-[#F3EAF1] flex items-center justify-center sm:p-4 select-none">
      {/* Khung điện thoại di động mô phỏng (Phone Frame) */}
      <div className="relative w-full max-w-[412px] h-[100dvh] sm:h-[860px] sm:max-h-[94vh] bg-[#FFF7FD] sm:rounded-[48px] sm:border-[8px] sm:border-[#261333]/15 sm:shadow-[0_25px_70px_-15px_rgba(38,19,51,0.25)] flex flex-col overflow-hidden [transform:translateZ(0)]">
        {/* Thanh trạng thái mô phỏng (Status Bar) trên Desktop */}
        <MobileStatusBar />

        {/* Nội dung màn hình di động */}
        <div className="relative flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col">
          {children}
        </div>

        {/* Thanh Home Indicator ở chân máy */}
        <HomeIndicator />
      </div>
    </div>
  )
}
