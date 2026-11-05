import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets, Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../core/theme';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  hasBottomBar?: boolean;
  header?: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  statusBarColor?: 'dark' | 'light';
}

export function Screen({
  children,
  scrollable = false,
  hasBottomBar = false,
  header,
  edges = ['top', 'left', 'right'],
  style,
  contentContainerStyle,
  statusBarColor = 'dark',
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const bottomPadding = hasBottomBar ? 104 : Math.max(insets.bottom, spacing.base);

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      <StatusBar barStyle={statusBarColor === 'dark' ? 'dark-content' : 'light-content'} />
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingBottom: bottomPadding }, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
});
