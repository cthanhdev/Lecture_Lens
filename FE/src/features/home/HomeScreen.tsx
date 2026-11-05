import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button, Chip, ProgressBar, IconButton, TimestampPill } from '../../shared/ui';
import { lectureRepo, studyRepo } from '../../core/data';
import { Lecture, StudyStats, Highlight } from '../../core/domain/types';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [continueLecture, setContinueLecture] = useState<Lecture | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  useEffect(() => {
    async function loadData() {
      const [lec, st, hls] = await Promise.all([
        lectureRepo.getContinueListening(),
        studyRepo.getStudyStats(),
        lectureRepo.getHighlights(),
      ]);
      setContinueLecture(lec);
      setStats(st);
      setHighlights(hls);
    }
    loadData();
  }, []);

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Kitsune Soft" title="Study Hub" />}
    >
      {/* Search Bar Tap Trigger */}
      <GlassCard
        variant="subtle"
        padding="base"
        radiusSize="pill"
        onPress={() => navigation.navigate('SearchTab')}
        style={styles.searchPill}
      >
        <View style={styles.searchRow}>
          <Feather name="search" size={18} color={colors.text.muted} />
          <Text variant="body" color="muted" style={styles.searchPlaceholder}>
            Search all your lectures, notes...
          </Text>
        </View>
      </GlassCard>

      {/* Hero Continue Listening Card */}
      {continueLecture && (
        <GlassCard
          variant="frosted"
          padding="xl"
          style={styles.heroCard}
          onPress={() =>
            navigation.navigate('LectureDetail', {
              lectureId: continueLecture.id,
              atSec: continueLecture.currentPlaybackSec,
            })
          }
        >
          <View style={styles.cardHeader}>
            <Text variant="label" color="coralDeep">
              ● CONTINUE LISTENING
            </Text>
            <Chip
              label={continueLecture.subjectName}
              subjectKey={continueLecture.subjectKey}
            />
          </View>

          <Text variant="title" style={styles.heroTitle}>
            {continueLecture.title}
          </Text>
          <Text variant="meta" color="muted" style={styles.heroChapter}>
            {continueLecture.chapterTitle}
          </Text>

          <ProgressBar progress={0.62} style={styles.progress} />

          <View style={styles.cardFooter}>
            <Text variant="caption" color="muted">
              29:58 / 48:20 (1.25x)
            </Text>
            <IconButton
              icon={<Feather name="play" size={18} color="#FFFFFF" />}
              variant="coral"
              size={42}
              onPress={() =>
                navigation.navigate('LectureDetail', {
                  lectureId: continueLecture.id,
                  atSec: continueLecture.currentPlaybackSec,
                })
              }
            />
          </View>
        </GlassCard>
      )}

      {/* Bento Grid: Due Today & Streak */}
      <View style={styles.bentoRow}>
        <GlassCard
          style={styles.bentoHalf}
          padding="base"
          onPress={() => navigation.navigate('FlashcardSession')}
        >
          <View style={styles.bentoHeader}>
            <Text variant="caption" color="muted">DUE TODAY</Text>
            <Feather name="bell" size={14} color={colors.brand.primary} />
          </View>
          <Text variant="display" color="primary">
            {stats?.cardsDueToday || 34}
          </Text>
          <Text variant="caption" color="secondary" style={styles.bentoSubtitle}>
            12/34 reviewed
          </Text>
          <Button
            title="Start review →"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('FlashcardSession')}
            style={styles.bentoBtn}
          />
        </GlassCard>

        <GlassCard
          style={styles.bentoHalf}
          padding="base"
          onPress={() => navigation.navigate('ReviewTab')}
        >
          <View style={styles.bentoHeader}>
            <Text variant="caption" color="muted">STREAK</Text>
            <Feather name="zap" size={14} color={palette.mochiGold} />
          </View>
          <Text variant="display" color="coralDeep">
            {stats?.streakDays || 12} <Text variant="title">days</Text>
          </Text>
          <Text variant="caption" color="secondary" style={styles.bentoSubtitle}>
            Top 5% consistency
          </Text>
          <View style={styles.streakDots}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <View
                key={idx}
                style={[
                  styles.streakDot,
                  idx < 5 ? styles.streakDotDone : styles.streakDotPending,
                ]}
              >
                <Text variant="caption" style={{ fontSize: 9 }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </View>

      {/* Recent Highlights Section */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="h3">Recent highlights</Text>
        <Button
          title="See all"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('LibraryTab')}
        />
      </View>

      {highlights.map((hl) => (
        <GlassCard
          key={hl.id}
          style={styles.highlightCard}
          padding="base"
          onPress={() =>
            navigation.navigate('LectureDetail', {
              lectureId: hl.lectureId,
              atSec: hl.atSec,
            })
          }
        >
          <Text variant="bodySemibold" style={styles.quoteText}>
            “{hl.quote}”
          </Text>
          <View style={styles.highlightFooter}>
            <Chip label={hl.subjectName} subjectKey={hl.subjectKey} />
            <TimestampPill
              timeStr={hl.atFormatted}
              variant="subtle"
              onPress={() =>
                navigation.navigate('LectureDetail', {
                  lectureId: hl.lectureId,
                  atSec: hl.atSec,
                })
              }
            />
          </View>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchPill: {
    marginVertical: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  searchPlaceholder: {
    marginLeft: spacing.base,
  },
  heroCard: {
    marginBottom: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  heroChapter: {
    marginTop: 2,
    marginBottom: spacing.base,
  },
  progress: {
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  bentoHalf: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoSubtitle: {
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  bentoBtn: {
    marginTop: spacing.xs,
  },
  streakDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  streakDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDotDone: {
    backgroundColor: colors.brand.primarySoft,
  },
  streakDotPending: {
    backgroundColor: colors.bg.container,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.md,
  },
  highlightCard: {
    marginBottom: spacing.base,
  },
  quoteText: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  highlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
