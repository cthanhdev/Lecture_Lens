import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip, StatusBadge } from '../../shared/ui';
import { subjectRepo, lectureRepo } from '../../core/data';
import { Subject, Lecture } from '../../core/domain/types';

export function SubjectDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subjectId = 'subj-macro' } = route.params || {};

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);

  useEffect(() => {
    async function load() {
      const [sub, lecs] = await Promise.all([
        subjectRepo.getSubjectById(subjectId),
        lectureRepo.getLectures({ subjectId }),
      ]);
      setSubject(sub);
      setLectures(lecs);
    }
    load();
  }, [subjectId]);

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title={subject?.name || 'Subject Detail'} />}
      contentContainerStyle={styles.container}
    >
      <View style={styles.heroBox}>
        <Chip
          label={subject?.code || 'ECON 201'}
          subjectKey={subject?.colorKey || 'macroeconomics'}
        />
        <Text variant="h1" style={styles.title}>
          {subject?.name}
        </Text>
        <Text variant="body" color="secondary">
          {subject?.instructor} · {subject?.term || 'Fall 2026'}
        </Text>
      </View>

      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        LECTURES IN THIS COURSE ({lectures.length})
      </Text>

      {lectures.map((lec) => (
        <GlassCard
          key={lec.id}
          style={styles.card}
          padding="base"
          onPress={() =>
            navigation.navigate('LectureDetail', {
              lectureId: lec.id,
              atSec: lec.currentPlaybackSec || 0,
            })
          }
        >
          <View style={styles.cardHeader}>
            <Text variant="caption" color="muted">
              {lec.dateFormatted} · {Math.floor(lec.durationSec / 60)} min
            </Text>
            <StatusBadge status={lec.status === 'READY' ? 'READY' : 'PROCESSING'} />
          </View>
          <Text variant="title" style={styles.cardTitle}>
            {lec.title}
          </Text>
          <Text variant="caption" color="muted">
            {lec.chapterTitle}
          </Text>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  heroBox: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    marginBottom: spacing.base,
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    marginBottom: 2,
  },
});
