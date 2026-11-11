import { Icon } from '../../../components/ui/icons/Icon.tsx'

interface SocialLoginGroupProps {
  mode: 'signin' | 'register'
  onSocialLogin?: (provider: 'apple' | 'google') => void
}

export function SocialLoginGroup({ mode, onSocialLogin }: SocialLoginGroupProps) {
  const isSignIn = mode === 'signin'

  const handleProvider = (provider: 'apple' | 'google') => {
    if (onSocialLogin) {
      onSocialLogin(provider)
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 mt-6">
      {/* Đường phân cách OR */}
      <div className="flex items-center gap-4 px-2">
        <div className="h-[1px] bg-[#261333]/12 flex-1" />
        <span className="text-[11px] font-extrabold tracking-wider text-[#56423F]/60 uppercase">
          OR
        </span>
        <div className="h-[1px] bg-[#261333]/12 flex-1" />
      </div>

      {/* Nút Apple */}
      <button
        type="button"
        onClick={() => handleProvider('apple')}
        className="h-[52px] w-full rounded-full bg-[#261333] hover:bg-[#1A0C24] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-3 transition-all duration-150 shadow-md shadow-[#261333]/15 cursor-pointer mochi-press select-none"
      >
        <Icon name="apple" size="md" />
        <span>{isSignIn ? 'Continue with Apple' : 'Sign up with Apple'}</span>
      </button>

      {/* Nút Google */}
      <button
        type="button"
        onClick={() => handleProvider('google')}
        className="h-[52px] w-full rounded-full bg-white hover:bg-white/90 active:scale-[0.98] text-[#261333] font-bold text-sm flex items-center justify-center gap-3 transition-all duration-150 border border-[#261333]/12 shadow-sm cursor-pointer mochi-press select-none"
      >
        <Icon name="google" size="md" />
        <span>{isSignIn ? 'Continue with Google' : 'Sign up with Google'}</span>
      </button>
    </div>
  )
}
