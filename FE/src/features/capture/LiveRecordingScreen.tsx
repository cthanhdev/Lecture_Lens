import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, radius, shadows, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip, Button } from '../../shared/ui';
import { subjectRepo, lectureRepo } from '../../core/data';
import { Subject } from '../../core/domain/types';

interface StarMark {
  id: string;
  sec: number;
  timeFormatted: string;
}

interface QuickNote {
  id: string;
  sec: number;
  timeFormatted: string;
  text: string;
}

export function LiveRecordingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subjectId = 'subj-macro' } = route.params || {};

  const [subject, setSubject] = useState<Subject | null>(null);
  const [seconds, setSeconds] = useState<number>(45); // Start at 00:45 for instant visual demo
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [starMarks, setStarMarks] = useState<StarMark[]>([
    { id: 'sm-1', sec: 18, timeFormatted: '00:18' },
    { id: 'sm-2', sec: 35, timeFormatted: '00:35' },
  ]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [waveSeed, setWaveSeed] = useState<number>(0);

  useEffect(() => {
    async function loadSubject() {
      const sub = await subjectRepo.getSubjectById(subjectId);
      setSubject(sub);
    }
    loadSubject();
  }, [subjectId]);

  // Timer tick
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Waveform animation jitter
  useEffect(() => {
    if (isPaused) return;
    const waveTimer = setInterval(() => {
      setWaveSeed((s) => s + 1);
    }, 250);
    return () => clearInterval(waveTimer);
  }, [isPaused]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMarkStar = () => {
    const newMark: StarMark = {
      id: `star-${Date.now()}`,
      sec: seconds,
      timeFormatted: formatTimer(seconds),
    };
    setStarMarks((prev) => [newMark, ...prev]);
  };

  const handleSaveNote = () => {
    if (!noteDraft.trim()) return;
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      sec: seconds,
      timeFormatted: formatTimer(seconds),
      text: noteDraft.trim(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setNoteDraft('');
    setShowNoteInput(false);
  };

  const handleStopRecording = () => {
    Alert.alert(
      'Finish Recording?',
      `Save this lecture (${formatTimer(seconds)}) and send to AI transcription pipeline?`,
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Save & Transcribe',
          style: 'default',
          onPress: async () => {
            const courseTitle = subject?.name || 'Classroom';
            const uploadRes = await lectureRepo.uploadAudio({
              title: `${courseTitle} Live Lecture - ${formatTimer(seconds)}`,
              subjectId,
              uri: 'file://mock/live_recording_buffer.m4a',
            });

            // Persist starred highlights
            for (const sm of starMarks) {
              await lectureRepo.createHighlight(
                uploadRes.lecture.id,
                `Starred moment at ${sm.timeFormatted}`,
                sm.sec
              );
            }

            navigation.replace('Processing', {
              lectureId: uploadRes.lecture.id,
              jobId: uploadRes.jobId,
            });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Recording?',
      'Are you sure you want to stop without saving? Current audio will be discarded.',
      [
        { text: 'Continue Recording', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  // Simulated live transcript speech according to current seconds
  const getLiveTranscriptText = () => {
    if (seconds < 20) {
      return 'Microphone calibrated. Classroom acoustic model active...';
    }
    if (seconds < 45) {
      return '“Today we continue our discussion on macroeconomic equilibrium and monetary policy transmission...”';
    }
    if (seconds < 70) {
      return '“Notice that the Phillips Curve demonstrates an inverse relationship between inflation and unemployment in the short-run...”';
    }
    return '“Let’s define demand-pull inflation versus cost-push supply shocks. Remember this equation for your midterm problem set.”';
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Live Recording"
          subtitle="44.1 kHz • Stereo Hi-Fi"
          onClosePress={handleCancel}
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* Course Indicator & Live Badge */}
      <View style={styles.topInfoRow}>
        <Chip
          label={subject?.name || 'Macroeconomics'}
          subjectKey={subject?.colorKey || 'macroeconomics'}
        />
        <View style={[styles.liveRecBadge, isPaused && styles.liveRecBadgePaused]}>
          <View style={[styles.recDot, isPaused && styles.recDotPaused]} />
          <Text variant="caption" color="white" style={styles.badgeText}>
            {isPaused ? 'PAUSED' : 'LIVE REC'}
          </Text>
        </View>
      </View>

      {/* Main Timer & Dynamic Waveform */}
      <GlassCard variant="frosted" padding="xl" style={styles.timerCard}>
        <Text variant="timer" center color="primary" style={styles.timerText}>
          {formatTimer(seconds)}
        </Text>
        <Text variant="caption" color="secondary" center style={styles.audioMeta}>
          {isPaused ? 'Recording paused' : 'Active Denoising • 320 kbps'}
        </Text>

        {/* Dynamic Amplitude Waveform Bars */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: 34 }).map((_, i) => {
            const dynamicAmp = isPaused
              ? 8
              : 10 + Math.abs(Math.sin((i * 0.7) + waveSeed * 0.5) * 58) +
                Math.abs(Math.cos(i * 0.3) * 16);

            return (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { height: dynamicAmp },
                  i % 2 === 0 ? styles.barActive : styles.barSoft,
                ]}
              />
            );
          })}
        </View>

        {/* Star marks indicator */}
        <View style={styles.marksSummaryRow}>
          <Feather name="star" size={13} color={palette.mochiGold} />
          <Text variant="caption" color="muted" style={styles.marksSummaryText}>
            {starMarks.length} key moments bookmarked
          </Text>
        </View>

        {/* Star marks pills scroll */}
        {starMarks.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marksScroll}
          >
            {starMarks.map((sm) => (
              <View key={sm.id} style={styles.starMarkPill}>
                <Feather name="star" size={10} color={palette.mochiGold} />
                <Text variant="caption" color="coralDeep" style={styles.starMarkTime}>
                  {sm.timeFormatted}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </GlassCard>

      {/* Live AI Speech-to-Text Preview */}
      <GlassCard style={styles.liveIdeaCard} padding="base">
        <View style={styles.ideaHeader}>
          <View style={styles.ideaLiveDot} />
          <Text variant="label" color="primary">
            PhoWhisper Live Transcript Preview
          </Text>
        </View>
        <Text variant="body" color="secondary" style={styles.ideaText}>
          {getLiveTranscriptText()}
        </Text>
      </GlassCard>

      {/* Quick Notes Section */}
      {notes.length > 0 && (
        <View style={styles.notesContainer}>
          <Text variant="meta" color="muted" style={styles.notesHeader}>
            PINNED NOTES ({notes.length})
          </Text>
          {notes.map((n) => (
            <GlassCard key={n.id} variant="subtle" padding="sm" style={styles.noteItem}>
              <View style={styles.noteTop}>
                <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
                  {n.timeFormatted}
                </Text>
              </View>
              <Text variant="bodySm" color="primary">
                {n.text}
              </Text>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Inline Quick Note Input */}
      {showNoteInput ? (
        <GlassCard padding="base" style={styles.noteInputBox}>
          <Text variant="label" color="primary">
            Note at {formatTimer(seconds)}:
          </Text>
          <TextInput
            placeholder="e.g. Professor said this will be on midterm..."
            placeholderTextColor={colors.text.muted}
            value={noteDraft}
            onChangeText={setNoteDraft}
            autoFocus
            style={styles.textInput}
          />
          <View style={styles.noteInputActions}>
            <Button
              title="Cancel"
              variant="ghost"
              size="sm"
              onPress={() => setShowNoteInput(false)}
            />
            <Button
              title="Save Note"
              variant="primary"
              size="sm"
              onPress={handleSaveNote}
            />
          </View>
        </GlassCard>
      ) : null}

      {/* Bottom Controls Bar */}
      <View style={styles.controlsRow}>
        {/* Mark Star Pill Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleMarkStar}
          style={[styles.actionPill, styles.starPill]}
        >
          <Feather name="star" size={20} color={palette.mochiGold} />
          <Text variant="label" style={styles.controlText}>
            Mark Star
          </Text>
        </TouchableOpacity>

        {/* Center Stop & Save Button */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleStopRecording}
          style={[styles.stopButton, shadows.coralGlow]}
        >
          <View style={styles.stopSquare} />
        </TouchableOpacity>

        {/* Pause / Resume Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsPaused((p) => !p)}
          style={[styles.actionPill, styles.pausePill]}
        >
          <Feather
            name={isPaused ? 'play' : 'pause'}
            size={20}
            color={colors.text.primary}
          />
          <Text variant="label" style={styles.controlText}>
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Add Note Link */}
      {!showNoteInput && (
        <TouchableOpacity
          onPress={() => setShowNoteInput(true)}
          style={styles.addNoteLink}
        >
          <Feather name="edit-2" size={14} color={colors.brand.primary} />
          <Text variant="label" color="coralDeep">
            + Add Quick Note at {formatTimer(seconds)}
          </Text>
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  liveRecBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
  liveRecBadgePaused: {
    backgroundColor: colors.text.muted,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  recDotPaused: {
    backgroundColor: '#E0E0E0',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 11,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  timerText: {
    marginTop: spacing.xs,
  },
  audioMeta: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    width: '100%',
    gap: 3,
    marginVertical: spacing.md,
  },
  waveformBar: {
    width: 3.5,
    borderRadius: 2,
  },
  barActive: {
    backgroundColor: colors.brand.primary,
  },
  barSoft: {
    backgroundColor: colors.brand.primarySoft,
  },
  marksSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  marksSummaryText: {
    marginLeft: 6,
  },
  marksScroll: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  starMarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(235, 169, 78, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 78, 0.3)',
  },
  starMarkTime: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveIdeaCard: {
    marginVertical: spacing.base,
  },
  ideaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  ideaLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.mintDeep,
  },
  ideaText: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  notesContainer: {
    marginBottom: spacing.base,
  },
  notesHeader: {
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  noteItem: {
    marginBottom: spacing.xs,
  },
  noteTop: {
    marginBottom: 2,
  },
  noteInputBox: {
    marginBottom: spacing.base,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingVertical: spacing.xs,
    marginVertical: spacing.xs,
    color: colors.text.primary,
  },
  noteInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
  },
  actionPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minWidth: 95,
  },
  starPill: {
    backgroundColor: 'rgba(235, 169, 78, 0.1)',
  },
  pausePill: {
    backgroundColor: colors.bg.surface,
  },
  controlText: {
    marginTop: 4,
  },
  stopButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSquare: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  addNoteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
});
