import { Outlet } from 'react-router-dom'

export function FullscreenLayout() {
  return (
    <div className="min-h-full flex-1 w-full bg-[#FFF7FD] text-[#261333] flex flex-col relative selection:bg-[#F5C3C9] selection:text-[#261333]">
      <main className="flex-1 w-full max-w-sm mx-auto px-4 py-4 flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
