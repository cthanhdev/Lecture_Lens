import React, { useState } from 'react'
import { Icon } from '../../../components/ui/icons/Icon.tsx'
import type { IconName } from '../../../components/ui/icons/types.ts'

export interface FormInputPillProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  leftIcon?: IconName
  showValidationCheck?: boolean
  error?: string
  helperText?: string
}

export const FormInputPill = React.forwardRef<HTMLInputElement, FormInputPillProps>(
  (
    {
      label,
      leftIcon,
      showValidationCheck = false,
      error,
      helperText,
      type = 'text',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const computedType = isPasswordType && showPassword ? 'text' : type

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full flex flex-col text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-[#261333] mb-1.5 ml-1 select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        <div
          className={`h-[52px] px-4 rounded-full bg-white/90 backdrop-blur-md border transition-all duration-200 flex items-center gap-3 relative shadow-xs ${
            error
              ? 'border-[#F47F72] ring-2 ring-[#F47F72]/20'
              : 'border-[#261333]/12 focus-within:border-[#F47F72] focus-within:ring-2 focus-within:ring-[#F47F72]/20'
          }`}
        >
          {leftIcon && (
            <div className="shrink-0 text-[#56423F]/80 flex items-center justify-center">
              <Icon name={leftIcon} size="md" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={computedType}
            className={`w-full bg-transparent text-[#261333] text-sm font-medium placeholder:text-[#56423F]/40 focus:outline-hidden ${className}`}
            {...props}
          />

          {/* Icon con mắt cho password */}
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="shrink-0 text-[#56423F]/70 hover:text-[#261333] transition-colors p-1 rounded-full mochi-press cursor-pointer"
            >
              <Icon name={showPassword ? 'eye-off' : 'eye'} size="sm" />
            </button>
          )}

          {/* Dấu check-circle xanh matcha khi hợp lệ */}
          {!isPasswordType && showValidationCheck && (
            <div className="shrink-0 text-emerald-600 flex items-center justify-center animate-in fade-in zoom-in-75 duration-200">
              <Icon name="check-circle" size="md" blob="matcha" />
            </div>
          )}
        </div>

        {error ? (
          <p className="text-[11px] font-semibold text-[#A03F36] mt-1 ml-3 animate-in fade-in duration-150">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-[#56423F]/70 mt-1 ml-3">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

FormInputPill.displayName = 'FormInputPill'
