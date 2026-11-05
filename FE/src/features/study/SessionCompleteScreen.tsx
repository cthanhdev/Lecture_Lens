import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader, SakuraBackdrop } from '../../shared/components';
import { Text, GlassCard, Button } from '../../shared/ui';

export function SessionCompleteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reviewedCards = 12, streakDays = 13, masteryPercentage = 84 } = route.params || {};

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
      <SakuraBackdrop petalCount={8} />

      <View style={styles.celebrationHero}>
        <View style={styles.mascotCircle}>
          <Text variant="display" style={styles.mascotEmoji}>
            🦊
          </Text>
          <View style={styles.partyBadge}>
            <Feather name="award" size={16} color="#FFFFFF" />
          </View>
        </View>

        <Text variant="display" center style={styles.congratsTitle}>
          Session Mastered!
        </Text>
        <Text variant="body" color="secondary" center style={styles.congratsDesc}>
          You just strengthened memory retention for Macroeconomics. Your spaced repetition queue is fully up to date!
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

      {/* Action Buttons */}
      <View style={styles.actionsCol}>
        <Button
          title="Back to Study Hub"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Main')}
          icon={<Feather name="home" size={18} color="#FFFFFF" />}
        />
        <Button
          title="Review Another Deck"
          variant="secondary"
          size="md"
          fullWidth
          onPress={() => navigation.navigate('ReviewTab')}
          style={styles.secondaryBtn}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  celebrationHero: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  mascotCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(244, 127, 114, 0.3)',
  },
  mascotEmoji: {
    fontSize: 48,
  },
  partyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  congratsTitle: {
    marginBottom: spacing.xs,
  },
  congratsDesc: {
    lineHeight: 22,
    maxWidth: 300,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xl,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionsCol: {
    gap: spacing.sm,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
