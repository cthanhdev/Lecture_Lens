// OnboardingSlideHeader: Uniform top Safe Area breathing spacer across Steps 1-3
import React from 'react'
import { StyleSheet, View } from 'react-native'

export const OnboardingSlideHeader: React.FC = () => {
  return <View style={styles.headerSpacer} />
}

const styles = StyleSheet.create({
  headerSpacer: {
    height: 32,
  },
})
