import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, radius, shadows, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip } from '../../shared/ui';

export function LiveRecordingScreen() {
  const navigation = useNavigation<any>();
  const [seconds, setSeconds] = useState(2634); // 00:43:54
  const [isPaused, setIsPaused] = useState(false);
  const [markedStars, setMarkedStars] = useState(2);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs > 0 ? (hrs < 10 ? '0' : '') + hrs + ':' : ''}${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStop = () => {
    navigation.replace('Processing', {
      lectureId: 'lec-7',
      jobId: 'job-live-session',
    });
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Live Recording"
          subtitle="Audio Memo · 44.1 kHz"
          onClosePress={() => navigation.goBack()}
        />
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.topInfoRow}>
        <Chip label="Macroeconomics" subjectKey="macroeconomics" />
        <View style={styles.liveRecBadge}>
          <View style={styles.redDot} />
          <Text variant="caption" color="white" style={{ fontWeight: '700' }}>
            LIVE REC
          </Text>
        </View>
      </View>

      {/* Main Timer & Waveform Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.timerCard}>
        <Text variant="timer" center color="primary" style={styles.timerText}>
          {formatTimer(seconds)}
        </Text>

        {/* Simulated Waveform Bars */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: 32 }).map((_, i) => {
            const height = 12 + Math.abs(Math.sin((i + seconds) * 0.4) * 54);
            return (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  { height },
                  i % 2 === 0 ? styles.barActive : styles.barSoft,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.starMarksSummary}>
          <Feather name="star" size={13} color={palette.mochiGold} />
          <Text variant="caption" color="muted" style={{ marginLeft: 6 }}>
            {markedStars} moments marked (12:40, 31:05)
          </Text>
        </View>
      </GlassCard>

      {/* Live AI Key Idea Stream Preview */}
      <GlassCard style={styles.liveIdeaCard} padding="base">
        <View style={styles.ideaHeader}>
          <Text variant="label" color="primary">
            ● Transcribing Live Idea
          </Text>
        </View>
        <Text variant="body" color="secondary" style={styles.ideaText}>
          “The Phillips Curve suggests an inverse relationship between inflation and unemployment in the short-run...”
        </Text>
      </GlassCard>

      {/* Action Controls */}
      <View style={styles.controlsRow}>
        {/* Mark Star */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMarkedStars((s) => s + 1)}
          style={[styles.actionPill, styles.starPill]}
        >
          <Feather name="star" size={20} color={colors.text.primary} />
          <Text variant="label" style={styles.controlText}>
            Mark Star
          </Text>
        </TouchableOpacity>

        {/* Center Stop Button */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleStop}
          style={[styles.stopButton, shadows.coralGlow]}
        >
          <View style={styles.stopSquare} />
        </TouchableOpacity>

        {/* Pause / Resume */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsPaused((p) => !p)}
          style={[styles.actionPill, styles.notePill]}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
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
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.xs,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  timerText: {
    marginVertical: spacing.md,
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
  starMarksSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  liveIdeaCard: {
    marginVertical: spacing.base,
  },
  ideaHeader: {
    marginBottom: spacing.xs,
  },
  ideaText: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  actionPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    minWidth: 100,
  },
  starPill: {
    backgroundColor: palette.mochiGold + '33',
  },
  notePill: {
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
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
