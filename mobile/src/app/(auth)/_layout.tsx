import React from 'react'
import { Stack } from 'expo-router'
import { KITSUNE_COLORS } from '../../theme/tokens'

/**
 * Auth Stack Layout for Screens 05 (Sign In) and 06 (Create Account).
 * Delegates synchronized Sakura backdrop, top bar, falling petals, and horizontal swipe pager
 * directly to AuthCarousel for seamless 60-120 FPS transitions.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
      }}
    />
  )
}
