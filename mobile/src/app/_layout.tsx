// Root Layout for LectureLens Native (Expo SDK 58)
import React, { useEffect, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Stack } from 'expo-router/js-stack'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useReducedMotion } from 'react-native-reanimated'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import {
  NavigationProvider,
  useAppNavigation,
} from '../navigation/NavigationContext'
import { buildKitsuneBookStackOptions } from '../navigation/stackCardInterpolator'
import { AudioProvider } from '../modules/audio/AudioContext'
import { initAuthRuntime } from '../modules/auth/infrastructure/authRuntime'
import { KITSUNE_COLORS } from '../theme/tokens'

// Giữ màn hình khởi động cho đến khi nạp xong phông chữ
SplashScreen.preventAutoHideAsync().catch(() => {})

function RootStackNavigator() {
  const nav = useAppNavigation()
  const reducedMotion = useReducedMotion()

  const bookStackOptions = useMemo(
    () =>
      buildKitsuneBookStackOptions({
        actionDirection: nav.transitionDirection,
        reducedMotion,
      }),
    [nav.transitionDirection, reducedMotion],
  )

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="lectures/[id]" options={bookStackOptions} />
      <Stack.Screen name="subjects/[courseId]" options={bookStackOptions} />
      <Stack.Screen name="settings" options={bookStackOptions} />
      <Stack.Screen
        name="(guarded)"
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />

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
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })

  useEffect(() => {
    void initAuthRuntime().catch(() => {})
  }, [])

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationProvider>
        <AudioProvider>
          <StatusBar style="dark" />
          <RootStackNavigator />
        </AudioProvider>
      </NavigationProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
})
