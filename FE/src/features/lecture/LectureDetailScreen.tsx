import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import {
  Text,
  GlassCard,
  Chip,
  SegmentedControl,
  TimestampPill,
  Button,
  IconButton,
  ProgressBar,
} from '../../shared/ui';
import { lectureRepo } from '../../core/data';
import { Lecture, LectureSummary, Highlight, TranscriptSegment } from '../../core/domain/types';

export function LectureDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId = 'lec-7', atSec = 0 } = route.params || {};

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [summary, setSummary] = useState<LectureSummary | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'highlights' | 'transcript' | 'cards'>('summary');
  const [playbackSec, setPlaybackSec] = useState(atSec || 761); // 12:41
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [lec, sum, hls, tr] = await Promise.all([
        lectureRepo.getLectureById(lectureId),
        lectureRepo.getSummary(lectureId),
        lectureRepo.getHighlights(lectureId),
        lectureRepo.getTranscript(lectureId),
      ]);
      setLecture(lec);
      setSummary(sum);
      setHighlights(hls);
      setTranscript(tr);
    }
    loadData();
  }, [lectureId]);

  const seekTo = (sec: number) => {
    setPlaybackSec(sec);
    setIsPlaying(true);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Audio Detail" />}
      contentContainerStyle={styles.container}
    >
      {/* Title & Metadata */}
      <View style={styles.metaRow}>
        <Chip
          label={lecture?.subjectName || 'Macroeconomics'}
          subjectKey={lecture?.subjectKey || 'macroeconomics'}
        />
        <Text variant="caption" color="muted">
          Nov 3 · 48:20
        </Text>
      </View>

      <Text variant="h1" style={styles.lectureTitle}>
        {lecture?.title || 'Lecture 7: Inflation & Monetary Policy'}
      </Text>
      <Text variant="body" color="secondary" style={styles.chapterTitle}>
        {lecture?.chapterTitle || 'Chapter 4: Macroeconomic Indicators & Central Banks'}
      </Text>

      {/* Capsule Audio Player */}
      <GlassCard variant="frosted" padding="base" style={styles.playerCard}>
        <View style={styles.playerTop}>
          <Text variant="caption" color="muted">
            {formatTime(playbackSec)}
          </Text>
          <Text variant="caption" color="coralDeep">
            ● Chapter 4 mark
          </Text>
          <Text variant="caption" color="muted">
            {formatTime(lecture?.durationSec || 2900)}
          </Text>
        </View>

        <ProgressBar
          progress={playbackSec / (lecture?.durationSec || 2900)}
          height={6}
          style={styles.playerProgress}
        />

        <View style={styles.playerControls}>
          <Chip label="1.0x" />

          <IconButton
            icon={<Feather name="rotate-ccw" size={18} color={colors.text.primary} />}
            variant="ghost"
            onPress={() => setPlaybackSec((s: number) => Math.max(s - 10, 0))}
          />

          <IconButton
            icon={<Feather name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />}
            variant="coral"
            size={48}
            onPress={() => setIsPlaying((p) => !p)}
          />

          <IconButton
            icon={<Feather name="rotate-cw" size={18} color={colors.text.primary} />}
            variant="ghost"
            onPress={() => setPlaybackSec((s: number) => s + 10)}
          />

          <IconButton
            icon={<Feather name="bookmark" size={18} color={colors.brand.primary} />}
            variant="glass"
            size={36}
          />
        </View>
      </GlassCard>

      {/* Segmented Navigation */}
      <SegmentedControl
        options={[
          { key: 'summary', label: 'Summary' },
          { key: 'highlights', label: 'Highlights', badge: highlights.length },
          { key: 'transcript', label: 'Transcript' },
          { key: 'cards', label: 'Cards' },
        ]}
        selectedKey={activeTab}
        onSelect={(k) => setActiveTab(k as any)}
        style={styles.segmented}
      />

      {/* Tab: Summary */}
      {activeTab === 'summary' && summary && (
        <View style={styles.tabContent}>
          {/* Key Ideas */}
          <GlassCard style={styles.sectionCard} padding="base">
            <View style={styles.sectionHeader}>
              <Text variant="title">Key Ideas</Text>
              <Chip label={`${summary.keyIdeas.length} Points`} />
            </View>
            {summary.keyIdeas.map((idea, idx) => (
              <View key={idx} style={styles.ideaItem}>
                <View style={styles.ideaNumberBadge}>
                  <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={styles.ideaText}>
                  {idea}
                </Text>
              </View>
            ))}
          </GlassCard>

          {/* Keywords */}
          <GlassCard style={styles.sectionCard} padding="base">
            <View style={styles.sectionHeader}>
              <Text variant="title">Keywords</Text>
              <Text variant="caption" color="muted">Lecture weights</Text>
            </View>
            <View style={styles.keywordsWrap}>
              {summary.keywords.map((kw) => (
                <Chip key={kw.id} label={kw.term} count={kw.count} />
              ))}
            </View>
          </GlassCard>

          {/* Definitions with Seekable Timestamps */}
          <GlassCard style={styles.sectionCard} padding="base">
            <View style={styles.sectionHeader}>
              <Text variant="title">Definitions</Text>
              <Text variant="caption" color="coralDeep">Active recall</Text>
            </View>
            {summary.definitions.map((def) => (
              <View key={def.id} style={styles.definitionItem}>
                <View style={styles.defTopRow}>
                  <Text variant="title" style={{ fontSize: 15 }}>
                    {def.term}
                  </Text>
                  <TimestampPill
                    timeStr={def.atFormatted}
                    onPress={() => seekTo(def.atSec)}
                  />
                </View>
                <Text variant="bodySm" color="secondary" style={styles.defBody}>
                  {def.body}
                </Text>
              </View>
            ))}
          </GlassCard>

          {/* Create Flashcards CTA */}
          <Button
            title="Create flashcards from summary"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('FlashcardSession')}
            icon={<Feather name="layers" size={18} color="#FFFFFF" />}
            style={styles.ctaBtn}
          />
        </View>
      )}

      {/* Tab: Highlights */}
      {activeTab === 'highlights' && (
        <View style={styles.tabContent}>
          {highlights.map((hl) => (
            <GlassCard key={hl.id} style={styles.highlightRowCard} padding="base">
              <Text variant="bodySemibold" style={styles.hlQuote}>
                “{hl.quote}”
              </Text>
              <View style={styles.hlFooter}>
                <TimestampPill
                  timeStr={hl.atFormatted}
                  variant="primary"
                  onPress={() => seekTo(hl.atSec)}
                />
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Tab: Transcript */}
      {activeTab === 'transcript' && (
        <View style={styles.tabContent}>
          {transcript.map((item) => (
            <View key={item.id} style={styles.transcriptLine}>
              <TimestampPill
                timeStr={item.timestampFormatted.replace(/[\[\]]/g, '')}
                variant="subtle"
                onPress={() => seekTo(item.startSec)}
              />
              <View style={styles.transcriptContent}>
                <Text variant="caption" color="muted">
                  {item.speaker || 'Prof. Henderson'}
                </Text>
                <Text variant="body" color="primary" style={styles.transcriptText}>
                  {item.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Tab: Cards */}
      {activeTab === 'cards' && (
        <View style={styles.tabContent}>
          <GlassCard style={styles.sectionCard} padding="xl">
            <Text variant="title" center style={{ marginBottom: spacing.xs }}>
              Generated Flashcard Deck
            </Text>
            <Text variant="body" color="secondary" center style={{ marginBottom: spacing.base }}>
              12 cards ready for spaced repetition testing
            </Text>
            <Button
              title="Start Review Session"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('FlashcardSession')}
            />
          </GlassCard>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxl,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  lectureTitle: {
    marginBottom: 4,
  },
  chapterTitle: {
    marginBottom: spacing.base,
    lineHeight: 20,
  },
  playerCard: {
    marginBottom: spacing.lg,
  },
  playerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerProgress: {
    marginVertical: spacing.sm,
  },
  playerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  segmented: {
    marginBottom: spacing.base,
  },
  tabContent: {
    gap: spacing.base,
  },
  sectionCard: {
    gap: spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ideaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ideaNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  ideaText: {
    flex: 1,
    lineHeight: 20,
  },
  keywordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  definitionItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
  },
  defTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  defBody: {
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: spacing.md,
  },
  highlightRowCard: {
    marginBottom: spacing.xs,
  },
  hlQuote: {
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  hlFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  transcriptLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  transcriptContent: {
    flex: 1,
    marginLeft: spacing.base,
  },
  transcriptText: {
    marginTop: 2,
    lineHeight: 20,
  },
});
