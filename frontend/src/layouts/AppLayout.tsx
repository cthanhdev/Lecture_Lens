import { Outlet } from 'react-router-dom'
import { FloatingIslandTabBar } from './FloatingIslandTabBar.tsx'
import { CapsuleAudioPlayer } from '../modules/audio/CapsuleAudioPlayer.tsx'
import { ModalSheetHost } from './ModalSheetHost.tsx'

export function AppLayout() {
  return (
    <div className="min-h-full flex-1 bg-[#FFF7FD] text-[#261333] flex flex-col relative selection:bg-[#F5C3C9] selection:text-[#261333]">
      {/* Vùng nội dung màn hình chính của ứng dụng di động */}
      <main className="flex-1 pb-36 w-full px-4 pt-2">
        <Outlet />
      </main>

      {/* Floating Capsule Audio Player - Neo giữ phát nhạc toàn cục */}
      <div className="fixed bottom-24 inset-x-0 z-30 px-3 pointer-events-none">
        <div className="w-full max-w-[380px] mx-auto pointer-events-auto">
          <CapsuleAudioPlayer />
        </div>
      </div>

      {/* Floating Island Tab Bar - 5 Tab lơ lửng */}
      <FloatingIslandTabBar />

      {/* Modal Bottom Sheet Host */}
      <ModalSheetHost />
    </div>
  )
}
