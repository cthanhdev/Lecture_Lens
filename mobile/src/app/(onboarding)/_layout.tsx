// Onboarding Stack Layout (Khóa gesture quay ngược về Splash S01)
import React from 'react'
import { Stack } from 'expo-router'
import { KITSUNE_COLORS } from '../../theme/tokens'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
        contentStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
      }}
    />
  )
}
