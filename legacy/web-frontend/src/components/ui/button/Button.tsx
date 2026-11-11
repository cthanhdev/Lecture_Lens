// Kitsune Soft Pill Button System
// Theo đặc tả Section 6.1 trong docs/design-system.md và AGENTS.md
import React from 'react'
import { clsx } from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'fab'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    // 1. Base Styles: Pill 9999px + Mochi Tactile Press
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-full select-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed mochi-press'

    // 2. Variants
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[#F47F72] text-white shadow-md shadow-[#F47F72]/30 hover:brightness-105 active:bg-[#A03F36]',
      secondary:
        'bg-white/70 backdrop-blur-md border border-[#261333]/12 text-[#261333] shadow-xs hover:bg-white/90 active:bg-white/60',
      tertiary:
        'bg-[#F5C3C9] text-[#261333] hover:brightness-95 active:bg-[#F5C3C9]/80',
      ghost:
        'bg-transparent text-[#56423F] hover:bg-[#261333]/5 hover:text-[#261333] active:bg-[#261333]/10',
      danger:
        'bg-[#A03F36] text-white shadow-md shadow-[#A03F36]/25 hover:brightness-105 active:bg-[#7B2E27]',
      fab:
        'bg-gradient-to-tr from-[#F47F72] to-[#F5C3C9] text-white shadow-lg shadow-[#F47F72]/35 hover:brightness-105 active:scale-95',
    }

    // 3. Sizes
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-9 px-4 text-xs gap-1.5',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-[52px] px-7 text-base gap-2.5 shadow-md',
      icon: 'w-10 h-10 p-0 rounded-full shrink-0',
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
