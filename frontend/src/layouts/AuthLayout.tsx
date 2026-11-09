import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-full flex-1 w-full bg-[#FFF7FD] text-[#261333] flex flex-col justify-center items-center px-4 py-6 relative selection:bg-[#F5C3C9] selection:text-[#261333]">
      {/* Background Soft Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#F5C3C9]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#A9D4E8]/25 blur-3xl pointer-events-none" />

      <main className="w-full max-w-sm mx-auto relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
