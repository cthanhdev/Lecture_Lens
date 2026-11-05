import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
import {
  Screen,
  AppHeader,
  WaveformVisualizer,
  LectureCard,
  OfflineBanner,
} from '../../shared/components';
import {
  Text,
  GlassCard,
  Button,
  Chip,
  IconButton,
  TimestampPill,
} from '../../shared/ui';
import { lectureRepo, studyRepo } from '../../core/data';
import { Lecture, StudyStats, Highlight } from '../../core/domain/types';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [continueLecture, setContinueLecture] = useState<Lecture | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [playbackSec, setPlaybackSec] = useState<number>(1798); // ~29:58
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      const [lec, list, st, hls] = await Promise.all([
        lectureRepo.getContinueListening(),
        lectureRepo.getLectures(),
        studyRepo.getStudyStats(),
        lectureRepo.getHighlights(),
      ]);
      setContinueLecture(lec);
      setAllLectures(list);
      setStats(st);
      setHighlights(hls);
      if (lec?.currentPlaybackSec) {
        setPlaybackSec(lec.currentPlaybackSec);
      }
    }
    loadData();
  }, []);

  const totalSec = continueLecture?.durationSec || 2900;
  const progressRatio = totalSec > 0 ? playbackSec / totalSec : 0.62;

  const handleSeek = (ratio: number) => {
    const targetSec = Math.floor(ratio * totalSec);
    setPlaybackSec(targetSec);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Kitsune Soft" title="Study Hub" />}
    >
      {showOfflineBanner && (
        <OfflineBanner
          onDismiss={() => setShowOfflineBanner(false)}
          onRetry={() => setShowOfflineBanner(false)}
        />
      )}

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
              atSec: playbackSec,
            })
          }
        >
          <View style={styles.cardHeader}>
            <View style={styles.statusIndicatorRow}>
              <View style={styles.livePulseDot} />
              <Text variant="label" color="coralDeep">
                CONTINUE LISTENING
              </Text>
            </View>
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

          {/* Interactive Waveform Visualizer */}
          <View style={styles.waveformBox}>
            <WaveformVisualizer
              progress={progressRatio}
              barCount={34}
              height={38}
              activeColor={colors.brand.primary}
              inactiveColor={colors.brand.primarySoft}
              onSeek={handleSeek}
            />
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text variant="caption" color="muted">
                {formatTime(playbackSec)} / {formatTime(totalSec)} (1.25x)
              </Text>
              <Text variant="label" color="secondary" style={styles.progressPercentText}>
                {Math.round(progressRatio * 100)}% completed
              </Text>
            </View>

            <View style={styles.playerButtonsRow}>
              <IconButton
                icon={
                  <Feather
                    name={isPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#FFFFFF"
                  />
                }
                variant="coral"
                size={46}
                onPress={() => setIsPlaying(!isPlaying)}
              />
            </View>
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
                <Text
                  variant="caption"
                  style={{ fontSize: 9, color: idx < 5 ? '#FFFFFF' : colors.text.muted }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </View>

      {/* Recently Added Section with Horizontal Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="h3">Recently added</Text>
        <Button
          title="See all"
          variant="ghost"
          size="sm"
          onPress={() => navigation.navigate('LibraryTab')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollList}
      >
        {allLectures.map((lec) => (
          <LectureCard
            key={lec.id}
            lecture={lec}
            variant="horizontal"
            onPress={() =>
              navigation.navigate('LectureDetail', {
                lectureId: lec.id,
                atSec: lec.currentPlaybackSec || 0,
              })
            }
          />
        ))}
      </ScrollView>

      {/* Recent Highlights Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: spacing.lg }]}>
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
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
  },
  heroTitle: {
    marginTop: spacing.sm,
  },
  heroChapter: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  waveformBox: {
    marginVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressPercentText: {
    fontSize: 11,
    marginTop: 2,
  },
  playerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  bentoHalf: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bentoSubtitle: {
    marginBottom: spacing.sm,
  },
  bentoBtn: {
    alignSelf: 'flex-start',
  },
  streakDots: {
    flexDirection: 'row',
    gap: 4,
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
    backgroundColor: palette.mochiGold,
  },
  streakDotPending: {
    backgroundColor: 'rgba(38, 19, 51, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  horizontalScrollList: {
    paddingRight: spacing.base,
    paddingBottom: spacing.xs,
  },
  highlightCard: {
    marginBottom: spacing.base,
  },
  quoteText: {
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  highlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
