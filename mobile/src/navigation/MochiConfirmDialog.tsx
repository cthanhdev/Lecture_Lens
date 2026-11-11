// Kitsune Soft MochiConfirmDialog for Mobile (React Native)
// Hộp thoại cảnh báo rời trang (Định luật 4 - Hiến chương điều hướng)
import React, { useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import { Icon } from '../components/ui/icons/Icon'
import { Button } from '../components/ui/button/Button'
import {
  KITSUNE_COLORS,
  KITSUNE_RADII,
  KITSUNE_SHADOWS,
} from '../theme/tokens'

const { width } = Dimensions.get('window')

export interface MochiConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export const MochiConfirmDialog: React.FC<MochiConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Rời khỏi trang',
  cancelText = 'Tiếp tục ở lại',
  onConfirm,
  onCancel,
}) => {
  const scale = useSharedValue(0.92)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (isOpen) {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      scale.value = 0.92
      opacity.value = 0
    }
  }, [isOpen, opacity, scale])

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  if (!isOpen) return null

  return (
    <Modal
      transparent
      animationType="none"
      visible={isOpen}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel}>
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View style={[styles.card, animatedCardStyle]}>
          {/* Header với Icon cảnh báo */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="flame" size="lg" strokeColor={KITSUNE_COLORS.kitsuneCoral} />
            </View>
            <Pressable onPress={onCancel} style={styles.closeBtn}>
              <Icon name="close" size="sm" strokeColor={KITSUNE_COLORS.plumInkMuted} />
            </Pressable>
          </View>

          {/* Tiêu đề & Nội dung */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Nút hành động */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              onPress={onCancel}
              style={styles.actionBtn}
            >
              {cancelText}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onPress={onConfirm}
              style={styles.actionBtn}
              textStyle={styles.exitText}
            >
              {confirmText}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38, 19, 51, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(width - 48, 380),
    backgroundColor: '#FFFFFF',
    borderRadius: KITSUNE_RADII.squircleCard,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    ...KITSUNE_SHADOWS.plumModal,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginBottom: 8,
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  actionBtn: {
    width: '100%',
  },
  exitText: {
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontSize: 13,
  },
})
