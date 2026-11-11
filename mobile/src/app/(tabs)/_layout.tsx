// Tabs Layout with Custom FloatingIslandTabBar
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { FloatingIslandTabBar } from '../../components/navigation/FloatingIslandTabBar'
import { KITSUNE_COLORS } from '../../theme/tokens'

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: KITSUNE_COLORS.washiCream },
        }}
        tabBar={() => <FloatingIslandTabBar />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="library" />
        <Tabs.Screen name="subjects" />
        <Tabs.Screen name="review" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KITSUNE_COLORS.washiCream,
  },
})
