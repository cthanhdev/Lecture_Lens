// SoftBlob Component: Tấm lót đốm hữu cơ pastel theo đặc tả 6.4 Kitsune Soft
import React from 'react'
import type { BlobColor } from './types.ts'
import { SOFT_BLOB_PALETTE, ORGANIC_BLOB_PATH } from './registry.ts'

interface SoftBlobProps {
  color?: BlobColor
  className?: string
  opacity?: number
}

export const SoftBlob: React.FC<SoftBlobProps> = ({
  color = 'sakura',
  className = '',
  opacity = 0.45,
}) => {
  const hex = SOFT_BLOB_PALETTE[color] || SOFT_BLOB_PALETTE.sakura

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`absolute -inset-1 w-[120%] h-[120%] pointer-events-none -z-10 translate-x-0.5 translate-y-0.5 ${className}`}
    >
      <path d={ORGANIC_BLOB_PATH} fill={hex} fillOpacity={opacity} />
    </svg>
  )
}
