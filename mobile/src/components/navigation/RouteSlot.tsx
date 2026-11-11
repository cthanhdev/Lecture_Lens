// RouteSlot Component for Native Mobile Navigation Testing
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { getParentFallback } from '../../navigation/parentFallback'
import { Button } from '../ui/button/Button'
import { Icon } from '../ui/icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../theme/tokens'

const { width } = Dimensions.get('window')

interface RouteSlotProps {
  id: string
  number: string
  name: string
  category: string
  description?: string
  children?: React.ReactNode
}

export function RouteSlot({
  id,
  number,
  name,
  category,
  description,
  children,
}: RouteSlotProps) {
  const nav = useAppNavigation()
  const fallback = getParentFallback(nav.currentRoute)

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {/* Top Badges */}
        <View style={styles.topBadges}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>Màn hình [{number}]</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>

        {/* Icon & Title */}
        <View style={styles.iconCircle}>
          <Icon name="sparkles" size="xl" strokeColor={KITSUNE_COLORS.kitsuneCoral} />
        </View>

        <Text style={styles.title}>{name}</Text>
        <View style={styles.routePill}>
          <Text style={styles.routeText}>{nav.currentRoute}</Text>
        </View>

        {description && <Text style={styles.desc}>{description}</Text>}

        {children}

        {/* Thông số điều hướng chuẩn */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rollback Fallback (Định luật 1):</Text>
            <Text style={styles.infoValueFallback}>{fallback}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Can Go Back:</Text>
            <Text style={styles.infoValueBack}>
              {nav.canGoBack ? 'Có (Pop Stack)' : 'Không (Dùng Fallback)'}
            </Text>
          </View>
        </View>

        {/* Nút điều hướng kiểm thử */}
        <View style={styles.actionCol}>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Icon name="arrow-left" size="sm" strokeColor={KITSUNE_COLORS.plumInk} />}
            onPress={() => nav.goBack()}
            style={styles.fullWidthBtn}
          >
            Kiểm tra Quay lại (goBack)
          </Button>

          <View style={styles.actionRow}>
            <Button
              variant="tertiary"
              size="sm"
              leftIcon={<Icon name="plus" size="xs" strokeColor={KITSUNE_COLORS.plumInk} />}
              onPress={() => nav.openSheet('add-audio')}
              style={styles.halfBtn}
            >
              Mở Bottom Sheet
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="headphones" size="xs" strokeColor="#FFFFFF" />}
              onPress={() => nav.goTo('/lectures/macro-101/transcript')}
              style={styles.halfBtn}
            >
              Đến Transcript
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    width: Math.min(width - 32, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: KITSUNE_RADII.squircleCard,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    ...KITSUNE_SHADOWS.miruku,
    alignItems: 'center',
  },
  topBadges: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  numberBadge: {
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 127, 114, 0.25)',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '700',
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  categoryBadge: {
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 195, 201, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
    marginBottom: 6,
  },
  routePill: {
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: KITSUNE_RADII.pill,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: KITSUNE_COLORS.plumInkMuted,
  },
  desc: {
    fontSize: 13,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  infoBox: {
    width: '100%',
    backgroundColor: KITSUNE_COLORS.washiCream,
    borderRadius: 16,
    padding: 12,
    gap: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  infoValueFallback: {
    fontSize: 11,
    fontWeight: '700',
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  infoValueBack: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A4325',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionCol: {
    width: '100%',
    gap: 8,
  },
  fullWidthBtn: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  halfBtn: {
    flex: 1,
  },
})
