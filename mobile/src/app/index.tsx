// [S01] Splash - App Launch Orchestrator
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { KITSUNE_COLORS } from '../theme/tokens'

export default function SplashScreen() {
  const router = useRouter()

  useEffect(() => {
    // Giả lập kiểm tra phiên đăng nhập và điều hướng an toàn sau 800ms
    const timer = setTimeout(() => {
      // Mặc định chuyển sang trang bàn học chính
      router.replace('/(tabs)/home')
    }, 800)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <View style={styles.container}>
      <View style={styles.brandBox}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>🦊</Text>
        </View>
        <Text style={styles.title}>LectureLens</Text>
        <Text style={styles.subtitle}>Trợ Lý Bài Giảng AI Tiếng Việt</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brandBox: {
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 32,
    backgroundColor: 'rgba(244, 127, 114, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
})
