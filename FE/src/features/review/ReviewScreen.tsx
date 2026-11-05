import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button, Chip, ProgressBar } from '../../shared/ui';
import { studyRepo } from '../../core/data';
import { Deck, StudyStats } from '../../core/domain/types';

export function ReviewScreen() {
  const navigation = useNavigation<any>();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const [dks, st] = await Promise.all([
        studyRepo.getDecks(),
        studyRepo.getStudyStats(),
      ]);
      setDecks(dks);
      setStats(st);
    }
    loadData();
  }, []);

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Spaced Repetition" title="Review Hub" />}
    >
      {/* Review Hero Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.dueNumberBox}>
            <Text variant="h1" color="primary">
              {stats?.cardsDueToday || 34}
            </Text>
            <Text variant="caption" color="muted">
              cards due
            </Text>
          </View>

          <View style={styles.heroTextCol}>
            <View style={styles.timeEstimate}>
              <Feather name="clock" size={13} color={colors.text.muted} />
              <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>
                About {stats?.estimatedMinutes || 9} min
              </Text>
            </View>
            <Text variant="title" style={styles.heroHeading}>
              Maintain your 14-day mastery
            </Text>
          </View>
        </View>

        <Button
          title="Start today's review ▷"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('FlashcardSession')}
          style={styles.startBtn}
        />
      </GlassCard>

      {/* 3 Metric Tiles: To Learn | In Progress | Retained */}
      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricTile} padding="base">
          <Feather name="book" size={16} color={palette.skyDeep} />
          <Text variant="h2" style={styles.metricVal}>
            {stats?.toLearnCount || 8}
          </Text>
          <Text variant="caption" color="muted">
            To learn
          </Text>
        </GlassCard>

        <GlassCard style={styles.metricTile} padding="base">
          <Feather name="repeat" size={16} color={colors.brand.primary} />
          <Text variant="h2" color="coralDeep" style={styles.metricVal}>
            {stats?.inProgressCount || 14}
          </Text>
          <Text variant="caption" color="muted">
            In progress
          </Text>
        </GlassCard>

        <GlassCard style={styles.metricTile} padding="base">
          <Feather name="check-circle" size={16} color={palette.mintDeep} />
          <Text variant="h2" style={styles.metricVal}>
            {stats?.retainedCount || 112}
          </Text>
          <Text variant="caption" color="muted">
            Retained
          </Text>
        </GlassCard>
      </View>

      {/* Decks Grid */}
      <View style={styles.decksHeaderRow}>
        <Text variant="h3">Decks ({decks.length} active)</Text>
      </View>

      <View style={styles.decksGrid}>
        {decks.map((deck) => (
          <GlassCard
            key={deck.id}
            style={styles.deckCard}
            padding="base"
            onPress={() =>
              navigation.navigate('FlashcardSession', { deckId: deck.id })
            }
          >
            <View style={styles.deckTop}>
              <Chip label={deck.subjectName} subjectKey={deck.subjectKey} />
              <View style={styles.dueBadge}>
                <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
                  {deck.dueCount} due
                </Text>
              </View>
            </View>

            <Text variant="title" numberOfLines={1} style={styles.deckTitle}>
              {deck.title}
            </Text>
            <Text variant="caption" color="muted" style={styles.deckCount}>
              {deck.cardCount} cards
            </Text>

            <View style={styles.masteryRow}>
              <Text variant="caption" color="secondary">
                Mastery {deck.masteryPercentage}%
              </Text>
            </View>
            <ProgressBar progress={deck.masteryPercentage / 100} height={4} />
          </GlassCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginVertical: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  dueNumberBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  heroTextCol: {
    flex: 1,
  },
  timeEstimate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heroHeading: {
    lineHeight: 20,
  },
  startBtn: {
    marginTop: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricTile: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    marginVertical: 2,
  },
  decksHeaderRow: {
    marginBottom: spacing.base,
  },
  decksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  deckCard: {
    width: '47.5%',
    marginBottom: spacing.xs,
  },
  deckTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dueBadge: {
    backgroundColor: colors.brand.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  deckTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  deckCount: {
    marginBottom: spacing.base,
  },
  masteryRow: {
    marginBottom: 4,
  },
});
