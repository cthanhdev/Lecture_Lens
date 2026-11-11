// SoftBlob Component: Tấm lót đốm hữu cơ pastel theo đặc tả 6.4 Kitsune Soft trên React Native
import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { BlobColor } from './types'
import { SOFT_BLOB_PALETTE, ORGANIC_BLOB_PATH } from './registry'

interface SoftBlobProps {
  color?: BlobColor
  size?: number
  opacity?: number
}

export const SoftBlob: React.FC<SoftBlobProps> = ({
  color = 'sakura',
  size = 24,
  opacity = 0.45,
}) => {
  const hex = SOFT_BLOB_PALETTE[color] || SOFT_BLOB_PALETTE.sakura
  const blobSize = size * 1.25

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
        },
      ]}
    >
      <Svg viewBox="0 0 24 24" width={blobSize} height={blobSize}>
        <Path d={ORGANIC_BLOB_PATH} fill={hex} fillOpacity={opacity} />
      </Svg>
    </View>
  )
}
