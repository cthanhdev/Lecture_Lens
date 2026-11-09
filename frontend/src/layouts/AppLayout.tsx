import { Outlet } from 'react-router-dom'
import { FloatingIslandTabBar } from './FloatingIslandTabBar.tsx'
import { CapsuleAudioPlayer } from '../modules/audio/CapsuleAudioPlayer.tsx'
import { ModalSheetHost } from './ModalSheetHost.tsx'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FFF7FD] text-[#261333] flex flex-col relative selection:bg-[#F5C3C9] selection:text-[#261333]">
      {/* Vùng nội dung màn hình chính */}
      <main className="flex-1 pb-36 max-w-2xl w-full mx-auto px-4 pt-4">
        <Outlet />
      </main>

      {/* Floating Capsule Audio Player - Neo giữ phát nhạc toàn cục */}
      <div className="fixed bottom-24 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
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
