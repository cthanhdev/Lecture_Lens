import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { KITSUNE_COLORS, KITSUNE_RADII } from '../../theme/tokens'
import { Icon } from '../ui/icons'

/**
 * Centered horizontal "OR" divider between the form card and social auth stack
 * matching Screens 05 & 06.
 */
export const AuthOrDivider: React.FC = () => (
  <View style={styles.dividerRow} accessibilityRole="text">
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>OR</Text>
    <View style={styles.dividerLine} />
  </View>
)

/**
 * Subtle coral error banner rendered inside the Miruku Glass form card
 * for credential or account-collision feedback.
 */
export const AuthErrorBanner: React.FC<{ message: string | null }> = ({
  message,
}) => {
  if (!message) {
    return null
  }

  return (
    <View
      style={styles.errorBanner}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon
        name="lock"
        size={15}
        strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
      />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(86, 66, 63, 0.14)',
  },
  dividerText: {
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: KITSUNE_RADII.squircleSmall,
    backgroundColor: 'rgba(244, 127, 114, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(160, 63, 54, 0.28)',
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
})
