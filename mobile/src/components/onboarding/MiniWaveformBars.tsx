// MiniWaveformBars: Pure View capsule waveform strips (Zero inline SVG)
import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { KITSUNE_COLORS } from '../../theme/tokens'
import type { WaveformBarSpec } from '../../modules/onboarding/types'

export interface WaveformHighlightZone {
  startIndex: number
  endIndex: number
}

interface MiniWaveformBarsProps {
  bars: readonly WaveformBarSpec[]
  barWidth?: number
  gap?: number
  inactiveColor?: string
  activeColor?: string
  highlightZones?: readonly WaveformHighlightZone[]
  highlightZoneColor?: string
  scale?: number
  style?: ViewStyle
}

export const MiniWaveformBars: React.FC<MiniWaveformBarsProps> = ({
  bars,
  barWidth = 3,
  gap = 8,
  inactiveColor = 'rgba(38, 19, 51, 0.22)',
  activeColor = KITSUNE_COLORS.kitsuneCoral,
  highlightZones,
  highlightZoneColor = 'rgba(255, 226, 122, 0.48)',
  scale = 1,
  style,
}) => {
  const step = barWidth + gap
  const maxBarHeight = bars.reduce(
    (max, bar) => Math.max(max, Math.max(4, Math.round(bar.height * scale))),
    16,
  )
  const validZones =
    highlightZones && highlightZones.length > 0 && bars.length > 0
      ? highlightZones
          .map((zone) => {
            const start = Math.max(0, Math.min(bars.length - 1, Math.floor(zone.startIndex)))
            const end = Math.max(0, Math.min(bars.length - 1, Math.floor(zone.endIndex)))
            if (end < start) {
              return null
            }
            const left = start * step - 4
            const width = (end - start + 1) * barWidth + (end - start) * gap + 8
            return { start, end, left, width }
          })
          .filter((z): z is NonNullable<typeof z> => z !== null)
      : []

  const barElements = bars.map((bar, idx) => (
    <View
      key={idx}
      style={{
        width: barWidth,
        height: Math.max(4, Math.round(bar.height * scale)),
        borderRadius: barWidth / 2,
        backgroundColor: bar.highlighted ? activeColor : inactiveColor,
      }}
    />
  ))

  return (
    <View style={[styles.row, { gap }, style]}>
      {validZones.length > 0 ? (
        <View style={[styles.track, { gap }]}>
          {validZones.map((zone, zIdx) => (
            <View
              key={`zone-${zIdx}`}
              pointerEvents="none"
              style={[
                styles.highlightHalo,
                {
                  left: zone.left,
                  width: zone.width,
                  height: maxBarHeight + 8,
                  borderRadius: (maxBarHeight + 8) / 2,
                  backgroundColor: highlightZoneColor,
                },
              ]}
            />
          ))}
          {barElements}
        </View>
      ) : (
        barElements
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightHalo: {
    position: 'absolute',
    alignSelf: 'center',
  },
})
