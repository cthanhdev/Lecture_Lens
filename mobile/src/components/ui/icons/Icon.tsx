// Polymorphic, Accessible Icon Component (Matt Pocock Deep Module for React Native)
import React from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { IconProps, IconSize, BlobColor } from './types'
import { ICON_REGISTRY } from './registry'
import { SoftBlob } from './SoftBlob'
import { KITSUNE_COLORS } from '../../../theme/tokens'

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
  strokeColor = KITSUNE_COLORS.plumInk,
  style,
  accessibilityLabel,
}) => {
  const def = ICON_REGISTRY[name]
  if (!def) {
    if (__DEV__) {
      console.warn(`[LectureLens Icon] Biểu tượng "${name}" không tồn tại trong từ điển Kitsune Soft!`)
    }
    return null
  }

  const px = resolvePixelSize(size)

  // Xác định màu blob nếu có
  const activeBlob: BlobColor | null =
    typeof blob === 'string'
      ? blob
      : blob === true
      ? def.blob || 'sakura'
      : null

  const isAccessible = Boolean(accessibilityLabel)

  return (
    <View
      accessibilityRole={isAccessible ? 'image' : 'none'}
      accessibilityLabel={accessibilityLabel}
      accessible={isAccessible}
      style={[
        {
          width: px,
          height: px,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {activeBlob && <SoftBlob color={activeBlob} size={px} />}
      <Svg viewBox="0 0 24 24" width={px} height={px} fill="none">
        {def.paths.map((p, idx) => {
          const rawFill = p.fill && p.fill !== 'none' ? p.fill : 'none'
          const fill = rawFill === 'currentColor' ? strokeColor : rawFill
          const rawStroke = p.stroke || (fill !== 'none' ? 'none' : strokeColor)
          const stroke =
            rawStroke === 'currentColor' ? strokeColor : rawStroke
          const width =
            p.strokeWidth || (stroke !== 'none' ? strokeWidth : undefined)

          return (
            <Path
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
      </Svg>
    </View>
  )
}
