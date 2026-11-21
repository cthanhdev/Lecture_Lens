import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'

export interface HomeSearchBarProps {
  readonly placeholder: string
  readonly trailingIcon: 'filter' | 'mic-off'
  readonly hint: string | null
  readonly isOffline: boolean
  readonly onPress: () => void
}

export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  placeholder,
  trailingIcon,
  hint,
  isOffline,
  onPress,
}) => {
  return (
    <View style={styles.wrapper}>
      <MochiPressable
        accessibilityLabel={placeholder}
        onPress={onPress}
        style={[styles.pill, isOffline && styles.offlinePill]}
      >
        <Icon
          name="search"
          size="md"
          strokeColor={KITSUNE_COLORS.plumInkMuted}
        />
        <Text numberOfLines={1} style={styles.placeholder}>
          {placeholder}
        </Text>
        <View style={[styles.trailingBadge, isOffline && styles.offlineTrailing]}>
          <Icon
            name={trailingIcon}
            size="xs"
            strokeColor={KITSUNE_COLORS.plumInkMuted}
          />
        </View>
      </MochiPressable>

      {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  pill: {
    height: 48,
    borderRadius: KITSUNE_RADII.pill,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    ...KITSUNE_SHADOWS.miruku,
  },
  offlinePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  placeholder: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: KITSUNE_COLORS.plumInkSubtle,
  },
  trailingBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F6EAF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTrailing: {
    backgroundColor: 'transparent',
  },
  hintText: {
    marginLeft: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkMuted,
  },
})
