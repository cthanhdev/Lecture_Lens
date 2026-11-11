interface AuthSkeletonViewProps {
  mode?: 'signin' | 'register'
}

export function AuthSkeletonView({ mode = 'signin' }: AuthSkeletonViewProps) {
  const isRegister = mode === 'register'

  return (
    <div className="w-full max-w-[390px] mx-auto flex flex-col items-center animate-pulse">
      {/* 1. Header Skeleton: Avatar Squircle 96x96 */}
      <div className="w-24 h-24 rounded-[28px] bg-white/70 border border-white/90 shadow-md mb-6 flex items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-tr from-[#F5C3C9]/30 to-[#FFE27A]/30" />
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
      </div>

      {/* 2. Headline Display Skeleton */}
      <div className="h-8 w-52 rounded-full bg-white/80 mb-2.5 shadow-xs" />
      <div className="h-4 w-64 rounded-full bg-white/60 mb-8" />

      {/* 3. Miruku Glass Form Card Skeleton */}
      <div className="w-full rounded-[28px] miruku-glass p-6 md:p-8 flex flex-col gap-4 border border-white/90 shadow-lg relative overflow-hidden">
        {/* Inputs */}
        {isRegister && (
          <div className="h-[52px] w-full rounded-full bg-white/80 border border-[#261333]/8" />
        )}
        <div className="h-[52px] w-full rounded-full bg-white/80 border border-[#261333]/8" />
        <div className="h-[52px] w-full rounded-full bg-white/80 border border-[#261333]/8" />

        {isRegister && (
          <div className="flex gap-2 w-full my-1">
            <div className="h-1.5 flex-1 rounded-full bg-white/80" />
            <div className="h-1.5 flex-1 rounded-full bg-white/80" />
            <div className="h-1.5 flex-1 rounded-full bg-white/80" />
          </div>
        )}

        {/* CTA Button */}
        <div className="h-[52px] w-full rounded-full bg-[#F47F72]/40 mt-3 shadow-md" />

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#261333]/10 my-2" />

        {/* Social Buttons */}
        <div className="h-[52px] w-full rounded-full bg-[#261333]/20" />
        <div className="h-[52px] w-full rounded-full bg-white/70 border border-[#261333]/8" />
      </div>
    </div>
  )
}
