import { Icon } from '../../../components/ui/icons/Icon.tsx'

interface KawaiiCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
}

export function KawaiiCheckbox({ checked, onChange, error }: KawaiiCheckboxProps) {
  return (
    <div className="flex flex-col text-left">
      <label className="inline-flex items-start gap-3 cursor-pointer select-none group mt-1">
        <div
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          onClick={() => onChange(!checked)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              onChange(!checked)
            }
          }}
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 mochi-press mt-0.5 ${
            checked
              ? 'bg-[#F47F72] text-white shadow-xs'
              : 'bg-white border-2 border-[#261333]/20 group-hover:border-[#F47F72]'
          } ${error ? 'border-[#A03F36]' : ''}`}
        >
          {checked && (
            <div className="animate-in zoom-in-50 duration-150">
              <Icon name="check" size="xs" strokeWidth={2.5} />
            </div>
          )}
        </div>

        <span className="text-xs text-[#56423F] font-medium leading-relaxed">
          Tôi đồng ý với{' '}
          <a
            href="#terms"
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-[#261333] hover:text-[#F47F72] underline transition-colors"
          >
            Điều khoản
          </a>{' '}
          và{' '}
          <a
            href="#privacy"
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-[#261333] hover:text-[#F47F72] underline transition-colors"
          >
            Chính sách bảo mật
          </a>
          .
        </span>
      </label>

      {error && (
        <p className="text-[11px] font-semibold text-[#A03F36] mt-1 ml-8">
          {error}
        </p>
      )}
    </div>
  )
}
