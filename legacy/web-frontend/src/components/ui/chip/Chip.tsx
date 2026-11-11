// Kitsune Soft Pill Chip Component
import React from 'react'
import { clsx } from 'clsx'

export type ChipVariant = 'default' | 'primary' | 'sakura' | 'mist' | 'mochi' | 'matcha'

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  variant?: ChipVariant
  icon?: React.ReactNode
  children: React.ReactNode
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  variant = 'default',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold select-none transition-all duration-150 cursor-pointer mochi-press'

  const activeStyles =
    'bg-[#F47F72] text-white shadow-xs shadow-[#F47F72]/30 border-transparent'

  const variantStyles: Record<ChipVariant, string> = {
    default:
      'bg-white/75 text-[#56423F] border border-[#261333]/10 hover:border-[#261333]/20 hover:text-[#261333]',
    primary:
      'bg-[#F47F72]/15 text-[#A03F36] border border-[#F47F72]/20 hover:bg-[#F47F72]/25',
    sakura:
      'bg-[#F5C3C9]/40 text-[#795358] border border-[#F5C3C9] hover:bg-[#F5C3C9]/60',
    mist:
      'bg-[#A9D4E8]/35 text-[#204C5C] border border-[#A9D4E8] hover:bg-[#A9D4E8]/50',
    mochi:
      'bg-[#FFE27A]/40 text-[#7B5400] border border-[#FFE27A] hover:bg-[#FFE27A]/60',
    matcha:
      'bg-[#BEE1D0]/40 text-[#0A4325] border border-[#BEE1D0] hover:bg-[#BEE1D0]/60',
  }

  return (
    <button
      type="button"
      className={clsx(
        baseClasses,
        active ? activeStyles : variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  )
}
