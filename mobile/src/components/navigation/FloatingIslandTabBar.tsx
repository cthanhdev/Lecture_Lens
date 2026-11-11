// Floating Island Tab Bar Component for React Native
// Theo đặc tả Section 8.1 trong docs/design-system.md và docs/UX-NAVIGATION-FLOW.md
import React from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useAppNavigation } from '../../navigation/NavigationContext'
import { Icon } from '../ui/icons/Icon'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../../theme/tokens'

const { width } = Dimensions.get('window')
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface TabItemProps {
  route: string
  label: string
  icon: any
  isActive: boolean
  onPress: () => void
}

const TabItem: React.FC<TabItemProps> = ({ label, icon, isActive, onPress }) => {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 120 })
    Haptics.selectionAsync().catch(() => {})
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 })
  }

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.tabItem, animatedStyle]}
    >
      <View
        style={[
          styles.iconWrap,
          isActive && styles.activeIconWrap,
        ]}
      >
        <Icon
          name={icon}
          size="md"
          strokeColor={isActive ? KITSUNE_COLORS.kitsuneCoral : KITSUNE_COLORS.plumInkMuted}
        />
      </View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
    </AnimatedPressable>
  )
}

export function FloatingIslandTabBar() {
  const nav = useAppNavigation()
  const route = nav.currentRoute

  // Ẩn tab bar trên các màn hình toàn cảnh hoặc quy trình nhạy cảm
  const isHidden =
    route.includes('/record') ||
    route.includes('/session') ||
    route.includes('/onboarding') ||
    route.includes('/auth')

  if (isHidden) return null

  const tabs = [
    { route: '/(tabs)/home', label: 'Bàn học', icon: 'home' as const },
    { route: '/(tabs)/library', label: 'Bài giảng', icon: 'library' as const },
    { route: '/(tabs)/subjects', label: 'Môn học', icon: 'subjects' as const },
    { route: '/(tabs)/review', label: 'Ôn tập', icon: 'review' as const },
    { route: '/(tabs)/profile', label: 'Hồ sơ', icon: 'profile' as const },
  ]

  return (
    <View style={styles.container} pointerEvents="box-none">
      <BlurView intensity={36} tint="light" style={styles.blurBar}>
        {/* 2 Tab Bên Trái: Home & Library */}
        <View style={styles.tabGroup}>
          {tabs.slice(0, 2).map((t) => (
            <TabItem
              key={t.route}
              route={t.route}
              label={t.label}
              icon={t.icon}
              isActive={route.includes(t.route) || (t.route.includes('home') && (route === '/' || route === '/home'))}
              onPress={() => nav.goTo(t.route)}
            />
          ))}
        </View>

        {/* Nút FAB Thêm Bài Giảng ở giữa */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thêm bài giảng mới"
          onPress={() => nav.openSheet('add-audio')}
          style={styles.fabButton}
        >
          <Icon name="plus" size="lg" strokeColor="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        {/* 3 Tab Bên Phải: Subjects, Review & Profile */}
        <View style={styles.tabGroup}>
          {tabs.slice(2).map((t) => (
            <TabItem
              key={t.route}
              route={t.route}
              label={t.label}
              icon={t.icon}
              isActive={route.includes(t.route)}
              onPress={() => nav.goTo(t.route)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 40,
  },
  blurBar: {
    width: Math.min(width - 32, 420),
    height: 64,
    borderRadius: KITSUNE_RADII.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    ...KITSUNE_SHADOWS.miruku,
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  activeLabel: {
    color: KITSUNE_COLORS.kitsuneCoral,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.plumModal,
  },
})
