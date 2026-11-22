// StudyScreenChrome: Shared Top App Bar & Page Header for Screens 08-12 (Home & Library)
import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { FramedBrandLogo } from '../onboarding/FramedBrandLogo'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'

export interface StudyTopBarProps {
  overline?: string
  title?: string
  brandLead?: 'library-icon' | 'mascot' | 'both'
  showNotificationAction?: boolean
  hasUnreadNotifications?: boolean
  showProfileAction?: boolean
  isOffline?: boolean
  onPressNotifications?: () => void
  onPressProfile?: () => void
  style?: StyleProp<ViewStyle>
}

export interface StudyPageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  showMascotAvatar?: boolean
  statusPillText?: string
  statusPillTone?: 'coral' | 'sakura' | 'mist'
  showProfileAvatar?: boolean
  isOffline?: boolean
  onPressProfile?: () => void
  style?: StyleProp<ViewStyle>
}

export interface StudyScreenChromeProps {
  topBar?: StudyTopBarProps
  pageHeader?: StudyPageHeaderProps
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export const StudyTopBar: React.FC<StudyTopBarProps> = ({
  overline = 'KITSUNE SOFT',
  title = 'Study Hub',
  brandLead = 'library-icon',
  showNotificationAction = true,
  hasUnreadNotifications = false,
  showProfileAction = false,
  isOffline = false,
  onPressNotifications,
  onPressProfile,
  style,
}) => {
  return (
    <View style={[styles.topBar, style]}>
      <View style={styles.topBarLeft}>
        {brandLead === 'library-icon' || brandLead === 'both' ? (
          <View style={styles.brandIconCircle}>
            <Icon
              name="library"
              size="md"
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
        ) : null}

        {brandLead === 'mascot' || brandLead === 'both' ? (
          <FramedBrandLogo variant="auth" scale={0.4} />
        ) : null}

        {overline || title ? (
          <View style={styles.topBarTitleCol}>
            {overline ? (
              <Text style={styles.topBarOverline} numberOfLines={1}>
                {overline}
              </Text>
            ) : null}
            {title ? (
              <Text style={styles.topBarTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.topBarActions}>
        {showNotificationAction ? (
          <Button
            variant="ghost"
            size="icon"
            accessibilityLabel="Notifications"
            onPress={onPressNotifications}
            style={styles.iconButtonSurface}
          >
            <Icon
              name={hasUnreadNotifications ? 'bell-dot' : 'bell'}
              size="md"
              strokeColor={KITSUNE_COLORS.plumInk}
            />
          </Button>
        ) : null}

        {showProfileAction ? (
          <Button
            variant={isOffline ? 'dark' : 'surface'}
            size="icon"
            accessibilityLabel="Student profile"
            onPress={onPressProfile}
          >
            <Icon
              name="profile"
              size="md"
              strokeColor={isOffline ? '#FFFFFF' : KITSUNE_COLORS.plumInk}
            />
          </Button>
        ) : null}
      </View>
    </View>
  )
}

export const StudyPageHeader: React.FC<StudyPageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  showMascotAvatar = false,
  statusPillText,
  statusPillTone = 'sakura',
  showProfileAvatar = false,
  isOffline = false,
  onPressProfile,
  style,
}) => {
  const pillStyle =
    statusPillTone === 'mist'
      ? styles.statusPillMist
      : statusPillTone === 'coral'
      ? styles.statusPillCoral
      : styles.statusPillSakura

  return (
    <View style={[styles.pageHeader, style]}>
      <View style={styles.pageHeaderLeft}>
        {showMascotAvatar ? (
          <FramedBrandLogo variant="auth" scale={0.48} />
        ) : null}

        <View style={styles.pageHeaderTitleCol}>
          {eyebrow ? (
            <Text style={styles.pageEyebrow} numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={styles.pageTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.pageSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.pageHeaderRight}>
        {statusPillText ? (
          <View style={[styles.statusPillBase, pillStyle]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>{statusPillText}</Text>
          </View>
        ) : null}

        {showProfileAvatar ? (
          <View style={styles.avatarWrapper}>
            <Button
              variant="dark"
              size="icon"
              accessibilityLabel="Open student profile"
              onPress={onPressProfile}
            >
              <Icon name="profile" size="md" strokeColor="#FFFFFF" />
            </Button>
            <View
              style={[
                styles.presenceDot,
                isOffline ? styles.presenceDotOffline : styles.presenceDotOnline,
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  )
}

export const StudyScreenChrome: React.FC<StudyScreenChromeProps> = ({
  topBar,
  pageHeader,
  children,
  style,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.root,
        { paddingTop: Math.max(insets.top, 8) },
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.ambientBackdrop}>
        <View style={styles.sakuraOrb} />
        <View style={styles.mistOrb} />
      </View>

      {topBar ? <StudyTopBar {...topBar} /> : null}
      {pageHeader ? <StudyPageHeader {...pageHeader} /> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
  ambientBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  sakuraOrb: {
    position: 'absolute',
    top: -64,
    right: -48,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 195, 201, 0.32)',
  },
  mistOrb: {
    position: 'absolute',
    top: 140,
    left: -72,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(169, 212, 232, 0.22)',
  },
  topBar: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconCircle: {
    width: 38,
    height: 38,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(245, 195, 201, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  topBarTitleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topBarOverline: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.7,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  topBarTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: KITSUNE_COLORS.plumInk,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButtonSurface: {
    backgroundColor: KITSUNE_COLORS.mirukuCard,
    borderWidth: 1,
    borderColor: KITSUNE_COLORS.mirukuBorder,
  },
  pageHeader: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pageHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageHeaderTitleCol: {
    flex: 1,
    gap: 1,
  },
  pageEyebrow: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.4,
    color: KITSUNE_COLORS.plumInk,
  },
  pageSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInkMuted,
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPillBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
  },
  statusPillSakura: {
    backgroundColor: 'rgba(245, 195, 201, 0.42)',
    borderColor: KITSUNE_COLORS.sakuraPink,
  },
  statusPillCoral: {
    backgroundColor: 'rgba(244, 127, 114, 0.16)',
    borderColor: 'rgba(244, 127, 114, 0.35)',
  },
  statusPillMist: {
    backgroundColor: 'rgba(169, 212, 232, 0.38)',
    borderColor: KITSUNE_COLORS.mistSky,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
  },
  statusPillText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  avatarWrapper: {
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: KITSUNE_COLORS.washiCream,
  },
  presenceDotOnline: {
    backgroundColor: KITSUNE_COLORS.matchaMint,
  },
  presenceDotOffline: {
    backgroundColor: KITSUNE_COLORS.mochiYellow,
  },
})
