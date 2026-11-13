// Floating Island Tab Bar Component for React Native
// Cấu trúc đối xứng 2 + 1 + 2 theo Kitsune Soft Design System & tabBarModel seam
import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { Icon } from '../ui/icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../theme/tokens'
import {
  FLOATING_TAB_SLOTS,
  TAB_BAR_GEOMETRY,
  getFloatingPillWidth,
  getFloatingTabBarBottomOffset,
  resolveTabBarState,
  type FloatingTabItem,
} from './tabBarModel'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function useMochiPressAnimation(
  pressedScale: number,
  hapticFeedback: 'selection' | 'impact' = 'selection'
) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const onPressIn = () => {
    scale.value = withTiming(pressedScale, { duration: 150 })
    if (hapticFeedback === 'impact') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    } else {
      Haptics.selectionAsync().catch(() => {})
    }
  }

  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 150 })
  }

  return { animatedStyle, onPressIn, onPressOut }
}

interface TabItemProps {
  readonly item: FloatingTabItem
  readonly isActive: boolean
  readonly onPress: () => void
}

const TabItem: React.FC<TabItemProps> = ({ item, isActive, onPress }) => {
  const { animatedStyle, onPressIn, onPressOut } = useMochiPressAnimation(0.95)
  const tintColor = isActive
    ? KITSUNE_COLORS.kitsuneCoral
    : KITSUNE_COLORS.plumInkMuted

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.tabTouchArea, animatedStyle]}
    >
      <View style={[styles.tabPill, isActive && styles.activeTabPill]}>
        <Icon name={item.icon} size="md" strokeColor={tintColor} />
        <Text
          numberOfLines={1}
          style={[styles.label, isActive && styles.activeLabel]}
        >
          {item.label}
        </Text>
      </View>
    </AnimatedPressable>
  )
}

interface CenterAddFabProps {
  readonly onPress: () => void
}

const CenterAddFab: React.FC<CenterAddFabProps> = ({ onPress }) => {
  const { animatedStyle, onPressIn, onPressOut } = useMochiPressAnimation(
    0.94,
    'impact'
  )

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Thêm bài giảng mới"
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.fabButton, animatedStyle]}
    >
      <Icon name="plus" size="lg" strokeColor="#FFFFFF" strokeWidth={2.5} />
    </AnimatedPressable>
  )
}

export function FloatingIslandTabBar() {
  const insets = useSafeAreaInsets()
  const { width: windowWidth } = useWindowDimensions()
  const nav = useAppNavigation()

  const tabState = resolveTabBarState(nav.currentRoute)
  if (!tabState.isVisible) return null

  const barWidth = getFloatingPillWidth(windowWidth)
  const bottomOffset = getFloatingTabBarBottomOffset(insets.bottom)

  const renderTab = (item: FloatingTabItem) => (
    <TabItem
      key={item.id}
      item={item}
      isActive={tabState.activeTabId === item.id}
      onPress={() => nav.goTo(item.route)}
    />
  )

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={[styles.islandShell, { width: barWidth }]}>
        {/* Tách riêng lớp nền kính mờ để overflow: hidden không cắt nút + nhô cao */}
        <View
          style={[StyleSheet.absoluteFill, styles.glassBackdrop]}
          pointerEvents="none"
        >
          <BlurView
            intensity={45}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.glassFrostOverlay]} />
        </View>

        {/* Bố cục đối xứng 2 + 1 + 2: (Home, Library) | spacer | (Review, Search) */}
        <View style={styles.tabRow}>
          <View style={styles.tabGroup}>
            {FLOATING_TAB_SLOTS.left.map(renderTab)}
          </View>
          <View style={styles.centerSpacer} />
          <View style={styles.tabGroup}>
            {FLOATING_TAB_SLOTS.right.map(renderTab)}
          </View>
        </View>

        {/* Nút + CTA san hô căn chính giữa và nhô lên trên viền đảo nổi */}
        <View style={styles.fabSlot} pointerEvents="box-none">
          <CenterAddFab onPress={() => nav.openSheet('add-audio')} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  islandShell: {
    height: TAB_BAR_GEOMETRY.barHeight,
    position: 'relative',
    overflow: 'visible',
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    ...KITSUNE_SHADOWS.miruku,
  },
  glassBackdrop: {
    borderRadius: KITSUNE_RADII.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  glassFrostOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TAB_BAR_GEOMETRY.horizontalInnerPadding,
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  centerSpacer: {
    width: TAB_BAR_GEOMETRY.centerGapWidth,
  },
  tabTouchArea: {
    flex: 1,
    height: TAB_BAR_GEOMETRY.barHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPill: {
    width: TAB_BAR_GEOMETRY.activePillWidth,
    height: TAB_BAR_GEOMETRY.activePillHeight,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  activeTabPill: {
    backgroundColor: 'rgba(244, 127, 114, 0.14)',
  },
  label: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600',
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  activeLabel: {
    fontWeight: '700',
    color: KITSUNE_COLORS.kitsuneCoral,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  fabSlot: {
    position: 'absolute',
    top: -TAB_BAR_GEOMETRY.fabProtrusion,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  fabButton: {
    width: TAB_BAR_GEOMETRY.fabSize,
    height: TAB_BAR_GEOMETRY.fabSize,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderWidth: TAB_BAR_GEOMETRY.fabBorderWidth,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: KITSUNE_COLORS.kitsuneCoral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
})
