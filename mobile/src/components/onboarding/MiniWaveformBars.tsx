// MiniWaveformBars: Pure View capsule waveform strips (Zero inline SVG)
import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { KITSUNE_COLORS } from '../../theme/tokens'
import type { WaveformBarSpec } from '../../modules/onboarding/types'

interface MiniWaveformBarsProps {
  bars: readonly WaveformBarSpec[]
  barWidth?: number
  gap?: number
  inactiveColor?: string
  activeColor?: string
  scale?: number
  style?: ViewStyle
}

export const MiniWaveformBars: React.FC<MiniWaveformBarsProps> = ({
  bars,
  barWidth = 3,
  gap = 8,
  inactiveColor = 'rgba(38, 19, 51, 0.22)',
  activeColor = KITSUNE_COLORS.kitsuneCoral,
  scale = 1,
  style,
}) => {
  return (
    <View style={[styles.row, { gap }, style]}>
      {bars.map((bar, idx) => (
        <View
          key={idx}
          style={{
            width: barWidth,
            height: Math.max(4, Math.round(bar.height * scale)),
            borderRadius: barWidth / 2,
            backgroundColor: bar.highlighted ? activeColor : inactiveColor,
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
