import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, ProgressBar, Button } from '../../shared/ui';
import { lectureRepo } from '../../core/data';

const STEPS = [
  { id: 'stt', title: 'PhoWhisper Speech-to-Text', desc: 'Generating precise timestamps [MM:SS]' },
  { id: 'chunk', title: 'Cornell Note Chunking', desc: 'Extracting key ideas, cues & formulas' },
  { id: 'embed', title: 'BGE-M3 Neural Embeddings', desc: 'Building on-device vector search index' },
  { id: 'ready', title: 'Lecture Studio Ready', desc: 'Summary & Flashcards generated' },
];

export function ProcessingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId = 'lec-7', jobId = 'job-1' } = route.params || {};

  const [activeStepIndex, setActiveStepIndex] = useState(1);
  const [progress, setProgress] = useState(0.45);

  useEffect(() => {
    const timer = setInterval(async () => {
      await lectureRepo.getJobStatus(jobId);
      setProgress((prev) => {
        const next = Math.min(prev + 0.2, 1.0);
        if (next >= 1.0) {
          clearInterval(timer);
          setTimeout(() => {
            navigation.replace('LectureDetail', { lectureId });
          }, 800);
        }
        return next;
      });

      setActiveStepIndex((idx) => Math.min(idx + 1, STEPS.length - 1));
    }, 1500);

    return () => clearInterval(timer);
  }, [jobId, lectureId, navigation]);

  return (
    <Screen
      header={<AppHeader variant="detail" title="AI Ingestion Pipeline" showBack={false} />}
      contentContainerStyle={styles.container}
    >
      <View style={styles.topHeader}>
        <View style={styles.spinnerCircle}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
        <Text variant="h1" center style={styles.heading}>
          Processing Lecture
        </Text>
        <Text variant="body" color="secondary" center style={styles.subheading}>
          Your audio is being transcribed and synthesized with neural AI.
        </Text>
      </View>

      <GlassCard variant="frosted" padding="xl" style={styles.progressCard}>
        <View style={styles.progressLabelRow}>
          <Text variant="label" color="primary">
            PIPELINE PROGRESS
          </Text>
          <Text variant="label" color="coralDeep">
            {Math.floor(progress * 100)}%
          </Text>
        </View>
        <ProgressBar progress={progress} height={8} />

        <View style={styles.stepsList}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;

            return (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    isCompleted && styles.stepBadgeDone,
                    isCurrent && styles.stepBadgeActive,
                  ]}
                >
                  {isCompleted ? (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      variant="caption"
                      color={isCurrent ? 'white' : 'muted'}
                      style={{ fontWeight: '700' }}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <View style={styles.stepTextCol}>
                  <Text
                    variant="title"
                    style={{ fontSize: 15, color: isCurrent ? colors.text.primary : colors.text.secondary }}
                  >
                    {step.title}
                  </Text>
                  <Text variant="caption" color="muted">
                    {step.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <Button
        title="Open Lecture Studio Now"
        variant="primary"
        size="lg"
        fullWidth
        onPress={() => navigation.replace('LectureDetail', { lectureId })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  topHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spinnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  heading: {
    marginBottom: spacing.xs,
  },
  subheading: {
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  progressCard: {
    marginBottom: spacing.xl,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepsList: {
    marginTop: spacing.xl,
    gap: spacing.base,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.containerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepBadgeActive: {
    backgroundColor: colors.brand.primary,
  },
  stepBadgeDone: {
    backgroundColor: palette.mintDeep,
  },
  stepTextCol: {
    flex: 1,
  },
});
