import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button } from '../../shared/ui';

export function SessionCompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reviewedCards = 12, streakDays = 13, masteryPercentage = 82 } = route.params || {};

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Session Complete"
          onClosePress={() => navigation.navigate('Main')}
        />
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.celebrationHero}>
        <View style={styles.iconCircle}>
          <Feather name="award" size={54} color={colors.brand.primary} />
        </View>
        <Text variant="display" center style={styles.congratsTitle}>
          Great Session!
        </Text>
        <Text variant="body" color="secondary" center style={styles.congratsDesc}>
          You just strengthened memory retention for your Macroeconomics midterm.
        </Text>
      </View>

      {/* Bento Performance Metrics */}
      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricCard} padding="base">
          <Text variant="caption" color="muted">CARDS</Text>
          <Text variant="h1" color="primary">{reviewedCards}</Text>
          <Text variant="caption" color="secondary">Reviewed</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} padding="base">
          <Text variant="caption" color="muted">STREAK</Text>
          <Text variant="h1" color="coralDeep">{streakDays}</Text>
          <Text variant="caption" color="secondary">Days 🔥</Text>
        </GlassCard>

        <GlassCard style={styles.metricCard} padding="base">
          <Text variant="caption" color="muted">MASTERY</Text>
          <Text variant="h1" color="primary">{masteryPercentage}%</Text>
          <Text variant="caption" color="secondary">Solid</Text>
        </GlassCard>
      </View>

      <Button
        title="Back to Review Hub"
        variant="primary"
        size="lg"
        fullWidth
        onPress={() => navigation.navigate('Main')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  celebrationHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  congratsTitle: {
    marginBottom: spacing.xs,
  },
  congratsDesc: {
    lineHeight: 22,
    paddingHorizontal: spacing.base,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xxl,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
});
