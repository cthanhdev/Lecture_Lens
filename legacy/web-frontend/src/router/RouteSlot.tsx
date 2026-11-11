import { ArrowLeft, Layers, Compass, Plus, Sparkles } from 'lucide-react'
import { useAppNavigation } from './useAppNavigation.ts'
import { getParentFallback } from './parentFallback.ts'

interface RouteSlotProps {
  id: string
  number: string
  name: string
  category: string
  description?: string
}

export function RouteSlot({ id, number, name, category, description }: RouteSlotProps) {
  const nav = useAppNavigation()
  const fallback = getParentFallback(nav.currentRoute)

  return (
    <div data-slot-id={id} className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      {/* Bento Squircle Container */}
      <div className="w-full max-w-md rounded-[32px] miruku-glass p-8 border border-white/90 shadow-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#F47F72]/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-[#A9D4E8]/20 blur-2xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center justify-between mb-6">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F47F72]/15 text-[#A03F36] border border-[#F47F72]/25">
            Màn hình [{number}]
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#261333]/5 text-[#56423F]">
            {category}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#FFF7FD] to-[#F5C3C9]/40 border border-white flex items-center justify-center text-[#F47F72] mx-auto mb-4 shadow-sm">
          <Layers className="w-8 h-8 stroke-[1.75]" />
        </div>

        <h2 className="text-xl font-extrabold text-[#261333] mb-1 tracking-tight">
          {name}
        </h2>
        <p className="font-mono text-xs text-[#56423F] bg-white/70 px-3 py-1.5 rounded-full inline-block border border-[#261333]/10 mb-4">
          {nav.currentRoute}
        </p>

        {description && (
          <p className="text-xs text-[#56423F]/80 leading-relaxed mb-6">
            {description}
          </p>
        )}

        <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 text-left text-xs space-y-1 mb-6">
          <div className="flex items-center justify-between text-[#56423F]">
            <span className="font-medium">Rollback Fallback:</span>
            <span className="font-mono text-[11px] font-semibold text-[#A03F36]">{fallback}</span>
          </div>
          <div className="flex items-center justify-between text-[#56423F]">
            <span className="font-medium">Can Go Back:</span>
            <span className="font-semibold text-emerald-600">{nav.canGoBack ? 'Có (Pop Stack)' : 'Không (Dùng Fallback)'}</span>
          </div>
        </div>

        {/* Quick Test Navigation Controls */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => nav.goBack()}
            className="w-full py-3 px-4 rounded-full bg-white hover:bg-slate-50 text-[#261333] border border-[#261333]/15 font-semibold text-xs flex items-center justify-center gap-2 transition-all mochi-press shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Kiểm tra Quay lại (goBack)
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => nav.openSheet('add-audio')}
              className="py-2.5 px-3 rounded-full bg-[#A9D4E8]/30 hover:bg-[#A9D4E8]/50 text-[#261333] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all mochi-press"
            >
              <Plus className="w-3.5 h-3.5" />
              Mở Bottom Sheet
            </button>

            <button
              type="button"
              onClick={() => nav.goTo('/lectures/macro-101/transcript')}
              className="py-2.5 px-3 rounded-full bg-[#BEE1D0]/40 hover:bg-[#BEE1D0]/60 text-[#261333] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all mochi-press"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Đến Transcript
            </button>
          </div>
        </div>

        {/* Developer Handoff Note */}
        <div className="mt-6 pt-4 border-t border-[#261333]/10 flex items-center justify-center gap-1.5 text-[11px] text-[#56423F]/70">
          <Compass className="w-3.5 h-3.5" />
          <span>Khay cắm chờ trang — Thay bằng view component của bạn tại <code>routes.tsx</code></span>
        </div>
      </div>
    </div>
  )
}
