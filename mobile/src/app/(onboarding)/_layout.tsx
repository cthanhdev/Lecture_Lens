import { Stack } from 'expo-router'
import { KITSUNE_COLORS } from '../../theme/tokens'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
        animation: 'slide_from_right',
      }}
    />
  )
}
