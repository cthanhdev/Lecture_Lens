import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { calculatePasswordStrength } from '../../modules/auth'
import { KITSUNE_COLORS } from '../../theme/tokens'

export interface PasswordStrengthMeterProps {
  password: string
}

const MUTED_SEGMENT = 'rgba(38, 19, 51, 0.10)'

const LEVEL_COLORS = {
  weak: {
    bar: KITSUNE_COLORS.kitsuneCoral,
    text: '#B34337',
  },
  fair: {
    bar: '#E2AC30',
    text: '#9B6F00',
  },
  good: {
    bar: '#7CA5B8',
    text: '#4F778A',
  },
} as const

/**
 * 3-segment Password Strength Meter matching Screen 06 (Create Account).
 */
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
}) => {
  const strength = calculatePasswordStrength(password)
  const palette = LEVEL_COLORS[strength.level]

  return (
    <View style={styles.container}>
      <View style={styles.segmentsRow}>
        {[1, 2, 3].map((segmentIndex) => {
          const isFilled = strength.score >= segmentIndex
          return (
            <View
              key={segmentIndex}
              style={[
                styles.segment,
                {
                  backgroundColor: isFilled ? palette.bar : MUTED_SEGMENT,
                },
              ]}
            />
          )
        })}
      </View>

      <View style={styles.feedbackRow}>
        <View style={styles.labelBadge}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  strength.score === 0 ? KITSUNE_COLORS.plumInkSubtle : palette.bar,
              },
            ]}
          />
          <Text
            style={[
              styles.levelLabel,
              {
                color:
                  strength.score === 0
                    ? KITSUNE_COLORS.plumInkMuted
                    : palette.text,
              },
            ]}
          >
            {strength.label}
          </Text>
        </View>

        <Text style={styles.feedbackText} numberOfLines={1}>
          {strength.feedback}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
    marginTop: 2,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  feedbackText: {
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'right',
    flexShrink: 1,
  },
})
