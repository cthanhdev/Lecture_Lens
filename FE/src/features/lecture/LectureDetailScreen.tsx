import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing, radius } from '../../core/theme';
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
  TextField,
} from '../../shared/ui';
import { lectureRepo } from '../../core/data';
import {
  Lecture,
  LectureSummary,
  Highlight,
  TranscriptSegment,
  AskAnswer,
} from '../../core/domain/types';

const SPEEDS = ['1.0x', '1.25x', '1.5x', '2.0x'];

export function LectureDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId = 'lec-7', atSec = 0 } = route.params || {};

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [summary, setSummary] = useState<LectureSummary | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'highlights' | 'transcript' | 'cards'>('summary');
  const [playbackSec, setPlaybackSec] = useState<number>(atSec || 761); // default ~12:41
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedIndex, setSpeedIndex] = useState<number>(0);

  // AI Q&A state
  const [qaQuery, setQaQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaAnswer, setQaAnswer] = useState<AskAnswer | null>(null);

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

  // Audio simulation timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPlaybackSec((prev) => {
        const total = lecture?.durationSec || 2900;
        if (prev >= total) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, lecture?.durationSec]);

  const seekTo = (sec: number) => {
    setPlaybackSec(sec);
    setIsPlaying(true);
  };

  const handleToggleSpeed = () => {
    setSpeedIndex((idx) => (idx + 1) % SPEEDS.length);
  };

  const handleBookmarkMoment = async () => {
    const formatted = formatTime(playbackSec);
    const newHighlight = await lectureRepo.createHighlight(
      lectureId,
      `Starred moment at ${formatted}`,
      playbackSec
    );
    setHighlights((prev) => [newHighlight, ...prev]);
    Alert.alert('Moment Bookmarked! ★', `Saved audio timestamp at ${formatted} to Highlights.`);
  };

  const handleAskAI = async (questionToAsk?: string) => {
    const query = questionToAsk || qaQuery;
    if (!query.trim()) return;

    setIsAsking(true);
    const answer = await lectureRepo.askQuestion(lectureId, query);
    setQaAnswer(answer);
    setIsAsking(false);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSec = lecture?.durationSec || 2900;
  const progressRatio = totalSec > 0 ? playbackSec / totalSec : 0;

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Lecture Studio" />}
      contentContainerStyle={styles.container}
    >
      {/* Title & Metadata */}
      <View style={styles.metaRow}>
        <Chip
          label={lecture?.subjectName || 'Macroeconomics'}
          subjectKey={lecture?.subjectKey || 'macroeconomics'}
        />
        <Text variant="caption" color="muted">
          {lecture?.dateFormatted || 'Nov 3'} · {formatTime(totalSec)}
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
          <View style={styles.activeDotRow}>
            {isPlaying && <View style={styles.liveGreenDot} />}
            <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
              {isPlaying ? 'PLAYING AUDIO' : 'PAUSED'}
            </Text>
          </View>
          <Text variant="caption" color="muted">
            {formatTime(totalSec)}
          </Text>
        </View>

        <ProgressBar
          progress={progressRatio}
          height={6}
          style={styles.playerProgress}
        />

        <View style={styles.playerControls}>
          <TouchableOpacity onPress={handleToggleSpeed} style={styles.speedButton}>
            <Text variant="caption" color="primary" style={{ fontWeight: '700' }}>
              {SPEEDS[speedIndex]}
            </Text>
          </TouchableOpacity>

          <IconButton
            icon={<Feather name="rotate-ccw" size={18} color={colors.text.primary} />}
            variant="ghost"
            onPress={() => setPlaybackSec((s) => Math.max(s - 10, 0))}
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
            onPress={() => setPlaybackSec((s) => Math.min(s + 10, totalSec))}
          />

          <IconButton
            icon={<Feather name="star" size={18} color={palette.mochiGold} />}
            variant="glass"
            size={36}
            onPress={handleBookmarkMoment}
          />
        </View>
      </GlassCard>

      {/* Segmented Navigation */}
      <SegmentedControl<'summary' | 'highlights' | 'transcript' | 'cards'>
        options={[
          { key: 'summary', label: 'Summary' },
          { key: 'highlights', label: 'Highlights', badge: highlights.length },
          { key: 'transcript', label: 'Transcript' },
          { key: 'cards', label: 'Cards' },
        ]}
        selectedKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
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

          {/* Exam Predictions */}
          {summary.examQuestions && summary.examQuestions.length > 0 && (
            <GlassCard style={styles.sectionCard} padding="base">
              <View style={styles.sectionHeader}>
                <Text variant="title">Exam Predictions</Text>
                <Text variant="caption" color="coralDeep">High probability</Text>
              </View>
              {summary.examQuestions.map((eq) => (
                <View key={eq.id} style={styles.examQuestionItem}>
                  <View style={styles.eqTopRow}>
                    <Chip label={eq.tag} />
                    <Text variant="caption" color="muted">
                      {eq.points} pts
                    </Text>
                  </View>
                  <Text variant="bodySemibold" style={styles.eqQuestion}>
                    {eq.question}
                  </Text>
                </View>
              ))}
            </GlassCard>
          )}

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
          {highlights.length === 0 ? (
            <GlassCard padding="xl" style={styles.emptyHighlights}>
              <Text variant="body" color="secondary" center>
                No highlights yet. Tap the star icon on the player to bookmark important moments.
              </Text>
            </GlassCard>
          ) : (
            highlights.map((hl) => (
              <GlassCard key={hl.id} style={styles.highlightRowCard} padding="base">
                <Text variant="bodySemibold" style={styles.hlQuote}>
                  “{hl.quote}”
                </Text>
                <View style={styles.hlFooter}>
                  <Chip label={hl.subjectName} subjectKey={hl.subjectKey} />
                  <TimestampPill
                    timeStr={hl.atFormatted}
                    variant="primary"
                    onPress={() => seekTo(hl.atSec)}
                  />
                </View>
              </GlassCard>
            ))
          )}
        </View>
      )}

      {/* Tab: Transcript */}
      {activeTab === 'transcript' && (
        <View style={styles.tabContent}>
          {transcript.map((item) => {
            const isCurrent =
              playbackSec >= item.startSec && playbackSec <= item.endSec;

            return (
              <View
                key={item.id}
                style={[
                  styles.transcriptLine,
                  isCurrent && styles.transcriptLineActive,
                ]}
              >
                <TimestampPill
                  timeStr={item.timestampFormatted.replace(/[\[\]]/g, '')}
                  variant={isCurrent ? 'primary' : 'subtle'}
                  onPress={() => seekTo(item.startSec)}
                />
                <View style={styles.transcriptContent}>
                  <View style={styles.speakerRow}>
                    <Text variant="caption" color="muted">
                      {item.speaker || 'Prof. Henderson'}
                    </Text>
                    {isCurrent && (
                      <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
                        ● Speaking now
                      </Text>
                    )}
                  </View>
                  <Text
                    variant="body"
                    color={isCurrent ? 'primary' : 'secondary'}
                    style={styles.transcriptText}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Tab: Cards */}
      {activeTab === 'cards' && (
        <View style={styles.tabContent}>
          <GlassCard style={styles.sectionCard} padding="xl">
            <View style={styles.cardsHeader}>
              <Chip label={lecture?.subjectName || 'Macroeconomics'} subjectKey={lecture?.subjectKey || 'macroeconomics'} />
              <Text variant="caption" color="muted">48 cards generated</Text>
            </View>
            <Text variant="h2" center style={{ marginVertical: spacing.xs }}>
              Active Recall Deck
            </Text>
            <Text variant="body" color="secondary" center style={{ marginBottom: spacing.base }}>
              Covers Demand-pull inflation, Cost-push supply shocks, Phillips Curve, and Quantity Theory of Money.
            </Text>
            <Button
              title="Start Flashcard Review ➔"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => navigation.navigate('FlashcardSession')}
            />
          </GlassCard>
        </View>
      )}

      {/* AI Q&A Assistant Section */}
      <View style={styles.qaSection}>
        <View style={styles.qaHeaderRow}>
          <Feather name="message-square" size={16} color={colors.brand.primary} />
          <Text variant="h3">Ask AI Assistant</Text>
        </View>

        {/* Preset Questions Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.qaChipsScroll}
        >
          <Chip
            label="What causes demand-pull inflation?"
            onPress={() => handleAskAI('What causes demand-pull inflation?')}
          />
          <Chip
            label="Explain the Phillips Curve"
            onPress={() => handleAskAI('Explain the Phillips Curve')}
          />
          <Chip
            label="What is the Fisher Effect?"
            onPress={() => handleAskAI('What is the Fisher Effect?')}
          />
        </ScrollView>

        {/* Input Question Bar */}
        <TextField
          placeholder="Ask anything about this lecture..."
          value={qaQuery}
          onChangeText={setQaQuery}
          leftIcon={<Feather name="help-circle" size={18} color={colors.text.muted} />}
          rightIcon={
            <TouchableOpacity onPress={() => handleAskAI()} disabled={isAsking}>
              <Feather name="arrow-right" size={18} color={colors.brand.primary} />
            </TouchableOpacity>
          }
          containerStyle={styles.qaInput}
        />

        {/* QA Answer Box if available */}
        {qaAnswer && (
          <GlassCard variant="frosted" padding="base" style={styles.qaAnswerCard}>
            <View style={styles.qaAnswerTop}>
              <View style={styles.aiBadge}>
                <Feather name="check-circle" size={12} color="#FFFFFF" />
                <Text variant="caption" color="white" style={{ fontWeight: '700' }}>
                  AI Verified Answer
                </Text>
              </View>
            </View>
            <Text variant="body" color="primary" style={styles.qaAnswerText}>
              {qaAnswer.answer}
            </Text>

            {qaAnswer.citations && qaAnswer.citations.length > 0 && (
              <View style={styles.citationBox}>
                <View style={styles.citationHeader}>
                  <Feather name="volume-2" size={14} color={colors.brand.primary} />
                  <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
                    Audio Citation ({qaAnswer.citations[0].startTime} - {qaAnswer.citations[0].endTime})
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={styles.citationQuote}>
                  “{qaAnswer.citations[0].textSnippet}”
                </Text>
                <TouchableOpacity
                  onPress={() => seekTo(760)}
                  style={styles.listenCitationBtn}
                >
                  <Feather name="play" size={12} color="#FFFFFF" />
                  <Text variant="caption" color="white" style={{ fontWeight: '700', marginLeft: 4 }}>
                    Listen Audio Citation ▶
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        )}
      </View>
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
  activeDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.mintDeep,
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
  speedButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(38, 19, 51, 0.06)',
    borderRadius: radius.pill,
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
  examQuestionItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
  },
  eqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eqQuestion: {
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: spacing.md,
  },
  emptyHighlights: {
    alignItems: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    borderRadius: radius.md,
  },
  transcriptLineActive: {
    backgroundColor: 'rgba(244, 127, 114, 0.08)',
  },
  transcriptContent: {
    flex: 1,
    marginLeft: spacing.base,
  },
  speakerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transcriptText: {
    marginTop: 2,
    lineHeight: 20,
  },
  cardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qaSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  qaChipsScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  qaInput: {
    marginVertical: spacing.xs,
  },
  qaAnswerCard: {
    marginTop: spacing.sm,
  },
  qaAnswerTop: {
    marginBottom: spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.mintDeep,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  qaAnswerText: {
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  citationBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  citationQuote: {
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  listenCitationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
});
