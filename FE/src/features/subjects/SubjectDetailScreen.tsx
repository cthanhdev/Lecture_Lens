import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../core/theme';
import {
  Screen,
  AppHeader,
  LectureCard,
  EmptyState,
} from '../../shared/components';
import { Text, GlassCard, Chip, SegmentedControl, Button, ProgressBar } from '../../shared/ui';
import { subjectRepo, lectureRepo, studyRepo } from '../../core/data';
import { Subject, Lecture, Deck } from '../../core/domain/types';

export function SubjectDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subjectId = 'subj-macro' } = route.params || {};

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeTab, setActiveTab] = useState<'lectures' | 'decks'>('lectures');

  useEffect(() => {
    async function load() {
      const [sub, lecs, allDecks] = await Promise.all([
        subjectRepo.getSubjectById(subjectId),
        lectureRepo.getLectures({ subjectId }),
        studyRepo.getDecks(),
      ]);
      setSubject(sub);
      setLectures(lecs);
      const courseDecks = allDecks.filter((d) => d.subjectId === subjectId);
      setDecks(courseDecks.length > 0 ? courseDecks : allDecks.slice(0, 1));
    }
    load();
  }, [subjectId]);

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title={subject?.name || 'Course Details'} />}
    >
      {/* Course Hero Header Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Chip
            label={subject?.code || 'ECON 201'}
            subjectKey={subject?.colorKey || 'macroeconomics'}
          />
          <View style={styles.termPill}>
            <Text variant="caption" color="muted">
              {subject?.term || 'Fall 2026'}
            </Text>
          </View>
        </View>

        <Text variant="h1" style={styles.title}>
          {subject?.name}
        </Text>

        <Text variant="body" color="secondary" style={styles.instructor}>
          {subject?.instructor} · Academic Department
        </Text>

        <View style={styles.statsSummaryRow}>
          <View style={styles.statItem}>
            <Text variant="caption" color="muted">Lectures</Text>
            <Text variant="h3">{lectures.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color="muted">Decks</Text>
            <Text variant="h3">{decks.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="caption" color="muted">Flashcards</Text>
            <Text variant="h3">
              {decks.reduce((sum, d) => sum + d.cardCount, 0) || 48}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Tabs: Lectures vs Flashcards */}
      <SegmentedControl<'lectures' | 'decks'>
        options={[
          { key: 'lectures', label: `Lectures (${lectures.length})` },
          { key: 'decks', label: `Flashcards (${decks.length})` },
        ]}
        selectedKey={activeTab}
        onSelect={setActiveTab}
        style={styles.segmentedTab}
      />

      {/* Tab Content */}
      {activeTab === 'lectures' ? (
        lectures.length === 0 ? (
          <EmptyState
            emoji="📚"
            title="No lectures yet"
            description="Start recording lectures in this course or upload existing recordings."
            actionTitle="Record First Lecture"
            actionIcon={<Feather name="mic" size={16} color="#FFFFFF" />}
            onAction={() => navigation.navigate('AddAudioSheet')}
          />
        ) : (
          <View style={styles.contentList}>
            {lectures.map((lec) => (
              <LectureCard
                key={lec.id}
                lecture={lec}
                onPress={() =>
                  navigation.navigate('LectureDetail', {
                    lectureId: lec.id,
                    atSec: lec.currentPlaybackSec || 0,
                  })
                }
                onPlayPress={() =>
                  navigation.navigate('LectureDetail', {
                    lectureId: lec.id,
                    atSec: lec.currentPlaybackSec || 0,
                  })
                }
              />
            ))}
          </View>
        )
      ) : (
        /* Decks Tab */
        decks.length === 0 ? (
          <EmptyState
            emoji="🗂️"
            title="No flashcard decks"
            description="Generate a smart study deck from one of your recorded lectures."
            actionTitle="View Lectures"
            onAction={() => setActiveTab('lectures')}
          />
        ) : (
          <View style={styles.contentList}>
            {decks.map((deck) => (
              <GlassCard
                key={deck.id}
                style={styles.deckCard}
                padding="base"
                onPress={() => navigation.navigate('FlashcardSession')}
              >
                <View style={styles.deckHeader}>
                  <Chip label={deck.subjectName} subjectKey={deck.subjectKey} />
                  <Text variant="caption" color="muted">
                    {deck.cardCount} cards
                  </Text>
                </View>

                <Text variant="title" style={styles.deckTitle}>
                  {deck.title}
                </Text>

                <View style={styles.masteryRow}>
                  <Text variant="caption" color="secondary">
                    Mastery: {deck.masteryPercentage}%
                  </Text>
                  <Text variant="caption" color="coralDeep">
                    {deck.dueCount} due today
                  </Text>
                </View>

                <ProgressBar
                  progress={deck.masteryPercentage / 100}
                  style={styles.deckProgress}
                />

                <Button
                  title="Practice Cards →"
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('FlashcardSession')}
                  style={styles.practiceBtn}
                />
              </GlassCard>
            ))}
          </View>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginVertical: spacing.md,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  termPill: {
    backgroundColor: 'rgba(38, 19, 51, 0.04)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  title: {
    marginVertical: spacing.xs,
  },
  instructor: {
    marginBottom: spacing.base,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  segmentedTab: {
    marginVertical: spacing.sm,
  },
  contentList: {
    paddingBottom: spacing.xl,
  },
  deckCard: {
    marginBottom: spacing.base,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deckTitle: {
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deckProgress: {
    marginBottom: spacing.base,
  },
  practiceBtn: {
    alignSelf: 'flex-start',
  },
});
