// Polymorphic, Accessible Icon Component (Matt Pocock Deep Module)
import React from 'react'
import type { IconProps, IconSize, BlobColor } from './types.ts'
import { ICON_REGISTRY } from './registry.ts'
import { SoftBlob } from './SoftBlob.tsx'

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
}

function resolvePixelSize(size: IconSize = 'lg'): number {
  if (typeof size === 'number') return size
  return SIZE_MAP[size] || 24
}

export const Icon: React.FC<IconProps> = ({
  name = 'sparkles',
  size = 'lg',
  blob,
  strokeWidth = 1.75,
  strokeColor,
  ariaLabel,
  className = '',
  style,
  ...rest
}) => {
  const def = ICON_REGISTRY[name]
  if (!def) {
    console.warn(`[LectureLens Icon] Biểu tượng "${name}" không tồn tại trong từ điển Kitsune Soft!`)
    return null
  }

  const px = resolvePixelSize(size)
  const isAccessible = Boolean(ariaLabel)

  // Xác định màu blob nếu có
  const activeBlob: BlobColor | null =
    typeof blob === 'string'
      ? blob
      : blob === true
      ? def.blob || 'sakura'
      : null

  const svgContent = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={px}
      height={px}
      fill="none"
      aria-label={isAccessible ? ariaLabel : undefined}
      aria-hidden={!isAccessible}
      role={isAccessible ? 'img' : 'presentation'}
      className={`inline-block shrink-0 transition-colors ${className}`}
      style={{
        ...style,
        color: strokeColor || style?.color || undefined,
      }}
      {...rest}
    >
      {def.paths.map((p, idx) => {
        const fill = p.fill ? p.fill : 'none'
        const hasFill = p.fill && p.fill !== 'none'
        const stroke = p.stroke || (hasFill ? 'none' : (strokeColor || 'currentColor'))
        const width = p.strokeWidth || (stroke !== 'none' ? strokeWidth : undefined)

        return (
          <path
            key={idx}
            d={p.d}
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )

  if (activeBlob) {
    return (
      <span className="relative inline-flex items-center justify-center shrink-0">
        <SoftBlob color={activeBlob} />
        {svgContent}
      </span>
    )
  }

  return svgContent
}
