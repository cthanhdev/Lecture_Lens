export interface HomeIndicatorProps {
  className?: string
  light?: boolean
}

export function HomeIndicator({ className = '', light = false }: HomeIndicatorProps) {
  return (
    <div
      className={`w-full flex justify-center items-center py-2 shrink-0 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div
        className={`w-[128px] h-1 rounded-full transition-colors ${
          light ? 'bg-white/40' : 'bg-[#1F1A21]/20'
        }`}
      />
    </div>
  )
}
