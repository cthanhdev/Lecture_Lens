import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { Icon } from '../ui/icons/Icon'
import { MochiPressable } from '../ui/pressable'
import { KITSUNE_COLORS, KITSUNE_SHADOWS } from '../../theme/tokens'
import type { HomeHeaderViewModel } from '../../modules/home'

const BRAND_LOGO = require('../../../assets/images/logo-LectureLens.png')

export interface HomeHeaderProps {
  readonly header: HomeHeaderViewModel
  readonly isOffline: boolean
  readonly onPressNotifications: () => void
  readonly onPressProfile: () => void
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  header,
  isOffline,
  onPressNotifications,
  onPressProfile,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandGroup}>
        {isOffline ? (
          <View style={styles.offlineLogoBadge}>
            <Image
              source={BRAND_LOGO}
              style={styles.offlineLogoImg}
              resizeMode="cover"
              accessibilityLabel="LectureLens Kitsune icon"
            />
          </View>
        ) : (
          <View style={styles.onlineIconBox}>
            <Icon
              name="library"
              size="md"
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
        )}

        <View>
          <Text style={styles.eyebrow}>{header.eyebrow}</Text>
          <Text style={styles.title}>{header.title}</Text>
        </View>
      </View>

      {header.rightAction === 'profile' ? (
        <MochiPressable
          accessibilityLabel="Open student profile"
          onPress={onPressProfile}
          style={styles.offlineProfileButton}
        >
          <Icon name="profile" size="sm" strokeColor="#FFFFFF" />
        </MochiPressable>
      ) : (
        <MochiPressable
          accessibilityLabel="Notifications"
          onPress={onPressNotifications}
          style={styles.bellButton}
        >
          <Icon name="bell" size="md" strokeColor={KITSUNE_COLORS.plumInk} />
        </MochiPressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 195, 201, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 195, 201, 0.5)',
    overflow: 'hidden',
    padding: 2,
  },
  offlineLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  eyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
    letterSpacing: 0.9,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: KITSUNE_COLORS.plumInk,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  offlineProfileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#8B3A32',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
})
