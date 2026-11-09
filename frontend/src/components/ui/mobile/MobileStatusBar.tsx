export function MobileStatusBar() {
  return (
    <div
      className="hidden sm:flex w-full items-center justify-between px-6 pt-3 pb-1 select-none pointer-events-none shrink-0 text-[#261333] text-xs font-bold tracking-tight z-50"
      aria-hidden="true"
    >
      {/* 1. Giờ hệ thống mô phỏng 9:41 */}
      <span className="w-12 text-left pl-1">9:41</span>

      {/* 2. Dynamic Island mô phỏng */}
      <div className="w-[110px] h-[26px] bg-[#261333] rounded-full shadow-xs flex items-center justify-end px-2.5 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-[#1F1A21] border border-[#261333] flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-[#402030]/80" />
        </div>
      </div>

      {/* 3. Tín hiệu sóng & Pin */}
      <div className="w-12 flex items-center justify-end gap-1.5 pr-1">
        {/* Signal Bars */}
        <div className="flex items-end gap-0.5 h-2.5">
          <div className="w-0.5 h-1 bg-current rounded-xs" />
          <div className="w-0.5 h-1.5 bg-current rounded-xs" />
          <div className="w-0.5 h-2 bg-current rounded-xs" />
          <div className="w-0.5 h-2.5 bg-current rounded-xs" />
        </div>

        {/* Battery Indicator */}
        <div className="w-5 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
          <div className="w-full h-full bg-current rounded-2xs" />
        </div>
      </div>
    </div>
  )
}
