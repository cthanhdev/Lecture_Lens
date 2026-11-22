// LectureStatusBadge: Shared Kitsune Soft status pill supporting all 6 variants across Screens 08-12
import React from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import type { LectureStatusBadgeVariant } from '../../modules/study/types'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'
import { Icon } from '../ui/icons/Icon'
import type { IconName } from '../ui/icons/types'

export interface LectureStatusBadgeProps {
  variant: LectureStatusBadgeVariant
  progress?: number
  labelOverride?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

interface StatusVisualConfig {
  label: string
  iconName: IconName
  backgroundColor: string
  borderColor: string
  textColor: string
  iconColor: string
}

const STATUS_VISUAL_MAP: Record<LectureStatusBadgeVariant, StatusVisualConfig> = {
  ready: {
    label: 'Ready',
    iconName: 'check-circle',
    backgroundColor: 'rgba(190, 225, 208, 0.52)',
    borderColor: KITSUNE_COLORS.matchaMint,
    textColor: '#0A4325',
    iconColor: '#0A4325',
  },
  transcribing: {
    label: 'Transcribing',
    iconName: 'waveform',
    backgroundColor: 'rgba(245, 195, 201, 0.45)',
    borderColor: 'rgba(244, 127, 114, 0.45)',
    textColor: KITSUNE_COLORS.kitsuneCoralDark,
    iconColor: KITSUNE_COLORS.kitsuneCoralDark,
  },
  downloaded: {
    label: 'Downloaded',
    iconName: 'check-circle',
    backgroundColor: 'rgba(190, 225, 208, 0.62)',
    borderColor: KITSUNE_COLORS.matchaMint,
    textColor: '#0A4325',
    iconColor: '#0A4325',
  },
  'device-only': {
    label: 'Device only',
    iconName: 'refresh',
    backgroundColor: 'rgba(169, 212, 232, 0.45)',
    borderColor: KITSUNE_COLORS.mistSky,
    textColor: '#204C5C',
    iconColor: '#204C5C',
  },
  failed: {
    label: 'Failed · Retry',
    iconName: 'refresh',
    backgroundColor: 'rgba(244, 127, 114, 0.16)',
    borderColor: 'rgba(244, 127, 114, 0.35)',
    textColor: KITSUNE_COLORS.kitsuneCoralDark,
    iconColor: KITSUNE_COLORS.kitsuneCoralDark,
  },
  'needs-connection': {
    label: 'Needs connection',
    iconName: 'wifi-off',
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
    borderColor: 'rgba(38, 19, 51, 0.12)',
    textColor: KITSUNE_COLORS.plumInkMuted,
    iconColor: KITSUNE_COLORS.plumInkMuted,
  },
}

function resolveBadgeLabel(
  variant: LectureStatusBadgeVariant,
  progress?: number,
  labelOverride?: string,
): string {
  if (labelOverride) {
    return labelOverride
  }
  if (variant === 'transcribing' && typeof progress === 'number') {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)))
    return `Transcribing ${clamped}%`
  }
  return STATUS_VISUAL_MAP[variant].label
}

export const LectureStatusBadge: React.FC<LectureStatusBadgeProps> = ({
  variant,
  progress,
  labelOverride,
  onPress,
  style,
}) => {
  const config = STATUS_VISUAL_MAP[variant]
  const label = resolveBadgeLabel(variant, progress, labelOverride)

  const content = (
    <>
      <Icon name={config.iconName} size={12} strokeColor={config.iconColor} />
      <Text style={[styles.label, { color: config.textColor }]}>{label}</Text>
    </>
  )

  const pillStyle = [
    styles.pill,
    {
      backgroundColor: config.backgroundColor,
      borderColor: config.borderColor,
    },
    style,
  ]

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [pillStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    )
  }

  return (
    <View accessibilityRole="text" accessibilityLabel={label} style={pillStyle}>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    minHeight: 24,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
})
