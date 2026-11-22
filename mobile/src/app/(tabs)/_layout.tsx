// Tabs Layout with BookPagePager, FloatingIslandTabBar & CapsuleAudioPlayer
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { BookPagePager } from '../../components/navigation/BookPagePager'
import { FloatingIslandTabBar } from '../../components/navigation/FloatingIslandTabBar'
import { CapsuleAudioPlayer } from '../../modules/audio/CapsuleAudioPlayer'
import { KITSUNE_COLORS } from '../../theme/tokens'

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <BookPagePager>
        <Tabs
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
          }}
          tabBar={() => null}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="library" />
          <Tabs.Screen name="review" />
          <Tabs.Screen name="search" />
          <Tabs.Screen name="subjects" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ href: null }} />
        </Tabs>
      </BookPagePager>
      <FloatingIslandTabBar />
      <CapsuleAudioPlayer />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
})
