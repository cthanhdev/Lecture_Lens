import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing, radius } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, ProgressBar, Button, Chip } from '../../shared/ui';
import { lectureRepo } from '../../core/data';
import { Lecture } from '../../core/domain/types';

interface PipelineStep {
  id: string;
  title: string;
  desc: string;
  threshold: number;
}

const STEPS: PipelineStep[] = [
  {
    id: 'stt',
    title: 'PhoWhisper Speech-to-Text',
    desc: 'Generating precise timestamps [MM:SS] & speaker cues',
    threshold: 0.35,
  },
  {
    id: 'chunk',
    title: 'Cornell Note & Topic Chunking',
    desc: 'Extracting 4 Key Ideas, Keywords & Definitions',
    threshold: 0.7,
  },
  {
    id: 'embed',
    title: 'BGE-M3 Neural Embeddings',
    desc: 'Building on-device vector search index for instant snippet jump',
    threshold: 0.9,
  },
  {
    id: 'ready',
    title: 'Lecture Studio Ready',
    desc: 'Summary, citations & smart Flashcards synthesized',
    threshold: 1.0,
  },
];

export function ProcessingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId = 'lec-7', jobId = 'job-1' } = route.params || {};

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [progress, setProgress] = useState<number>(0.15);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  useEffect(() => {
    async function loadLec() {
      const lec = await lectureRepo.getLectureById(lectureId);
      setLecture(lec);
    }
    loadLec();
  }, [lectureId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 0.18, 1.0);

        // Update active step index based on progress
        const stepIdx = STEPS.findIndex((s) => next <= s.threshold);
        setActiveStepIndex(stepIdx === -1 ? STEPS.length - 1 : stepIdx);

        if (next >= 1.0) {
          clearInterval(timer);
          setTimeout(() => {
            navigation.replace('LectureDetail', { lectureId });
          }, 700);
        }
        return next;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [jobId, lectureId, navigation]);

  const handleSkip = () => {
    navigation.replace('LectureDetail', { lectureId });
  };

  return (
    <Screen
      scrollable
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
          Your lecture audio is being transcribed and synthesized with neural AI.
        </Text>

        {lecture && (
          <View style={styles.lecturePreviewBadge}>
            <Chip label={lecture.subjectName} subjectKey={lecture.subjectKey} />
            <Text variant="caption" color="muted" numberOfLines={1} style={styles.previewTitle}>
              {lecture.title}
            </Text>
          </View>
        )}
      </View>

      {/* Progress & Stepper Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.progressCard}>
        <View style={styles.progressLabelRow}>
          <Text variant="label" color="primary">
            PIPELINE SYNTHESIS
          </Text>
          <Text variant="label" color="coralDeep" style={styles.percentText}>
            {Math.floor(progress * 100)}%
          </Text>
        </View>

        <ProgressBar progress={progress} height={8} style={styles.progressBar} />

        <View style={styles.stepsList}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex || progress >= 1.0;
            const isCurrent = idx === activeStepIndex && progress < 1.0;

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
                      style={styles.stepIndexText}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>

                <View style={styles.stepTextCol}>
                  <Text
                    variant="bodySemibold"
                    color={isCurrent ? 'coralDeep' : isCompleted ? 'primary' : 'muted'}
                  >
                    {step.title}
                  </Text>
                  <Text variant="caption" color="secondary" style={styles.stepDesc}>
                    {step.desc}
                  </Text>
                </View>

                {isCurrent && (
                  <View style={styles.pulsingTag}>
                    <Text variant="caption" color="coralDeep" style={styles.activeTagText}>
                      Running...
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </GlassCard>

      {/* Live Status Info Banner */}
      <GlassCard variant="subtle" padding="base" style={styles.infoBanner}>
        <View style={styles.infoRow}>
          <Feather name="cpu" size={16} color={colors.brand.primary} />
          <View style={styles.infoTextCol}>
            <Text variant="caption" color="secondary">
              Accelerated with Cornell Note Chunking & Spaced Repetition indexing.
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Fast Forward / Skip button for Testing */}
      <Button
        title="Skip to Lecture Studio →"
        variant="ghost"
        size="md"
        onPress={handleSkip}
        style={styles.skipBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topHeader: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  spinnerCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(244, 127, 114, 0.25)',
  },
  heading: {
    marginBottom: spacing.xs,
  },
  subheading: {
    maxWidth: 290,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  lecturePreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  previewTitle: {
    maxWidth: 180,
  },
  progressCard: {
    marginBottom: spacing.base,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  percentText: {
    fontWeight: '700',
  },
  progressBar: {
    marginBottom: spacing.xl,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  stepBadgeActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  stepBadgeDone: {
    backgroundColor: palette.mintDeep,
    borderColor: palette.mintDeep,
  },
  stepIndexText: {
    fontWeight: '700',
    fontSize: 11,
  },
  stepTextCol: {
    flex: 1,
  },
  stepDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  pulsingTag: {
    backgroundColor: 'rgba(244, 127, 114, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoBanner: {
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoTextCol: {
    flex: 1,
  },
  skipBtn: {
    alignSelf: 'center',
  },
});
