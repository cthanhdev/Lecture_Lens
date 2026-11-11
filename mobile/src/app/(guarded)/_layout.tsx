import { Stack } from 'expo-router'
import { KITSUNE_COLORS } from '@/theme/tokens'

export default function GuardedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
        gestureEnabled: false, // Chặn vuốt Back cử chỉ để kiểm soát hoàn toàn bởi Guard (Định luật 4)
      }}
    />
  )
}
