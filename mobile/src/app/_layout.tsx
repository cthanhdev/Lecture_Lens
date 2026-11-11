// Root Layout for LectureLens Native (Expo SDK 58)
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { NavigationProvider } from '../navigation/NavigationContext'
import { AudioProvider } from '../modules/audio/AudioContext'
import { KITSUNE_COLORS } from '../theme/tokens'

// Giữ màn hình khởi động cho đến khi nạp xong phông chữ
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <NavigationProvider>
      <AudioProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="lectures/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="subjects/[courseId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(guarded)" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          
          {/* Modal Sheet Stack (Định luật 3) */}
          <Stack.Screen
            name="(modal)/add-audio"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="(modal)/paywall"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="(modal)/search"
            options={{
              presentation: 'modal',
              animation: 'fade',
            }}
          />
        </Stack>
      </AudioProvider>
    </NavigationProvider>
  )
}
