import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip, StatusBadge, Button } from '../../shared/ui';
import { lectureRepo, subjectRepo } from '../../core/data';
import { Lecture, Subject } from '../../core/domain/types';

export function LibraryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(
    route.params?.subjectId
  );
  const [lectures, setLectures] = useState<Lecture[]>([]);

  useEffect(() => {
    async function init() {
      const subjs = await subjectRepo.getSubjects();
      setSubjects(subjs);
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchLectures() {
      const data = await lectureRepo.getLectures({ subjectId: selectedSubjectId });
      setLectures(data);
    }
    fetchLectures();
  }, [selectedSubjectId]);

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Archive" title="Library" />}
    >
      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Chip
          label="All"
          count={lectures.length}
          selected={!selectedSubjectId}
          onPress={() => setSelectedSubjectId(undefined)}
        />
        {subjects.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            count={s.lectureCount}
            subjectKey={s.colorKey}
            selected={selectedSubjectId === s.id}
            onPress={() =>
              setSelectedSubjectId(selectedSubjectId === s.id ? undefined : s.id)
            }
          />
        ))}
      </ScrollView>

      {/* Lectures List or Empty State */}
      {lectures.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.mascotIconBox}>
            <Feather name="folder" size={48} color={colors.brand.primary} />
          </View>
          <Text variant="h2" center style={styles.emptyTitle}>
            No recordings yet
          </Text>
          <Text variant="body" color="secondary" center style={styles.emptyDesc}>
            Record your first lecture or upload an audio file to get started.
          </Text>
          <Button
            title="Record your first lecture"
            variant="primary"
            size="md"
            onPress={() => navigation.navigate('AddAudioSheet')}
            icon={<Feather name="mic" size={16} color="#FFFFFF" />}
            style={styles.emptyBtn}
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text variant="meta" color="muted" style={styles.sectionTitle}>
            RECORDINGS ({lectures.length})
          </Text>
          {lectures.map((lec) => (
            <GlassCard
              key={lec.id}
              style={styles.lectureCard}
              padding="base"
              onPress={() =>
                navigation.navigate('LectureDetail', {
                  lectureId: lec.id,
                  atSec: lec.currentPlaybackSec || 0,
                })
              }
            >
              <View style={styles.cardTop}>
                <Chip label={lec.subjectName} subjectKey={lec.subjectKey} />
                <StatusBadge
                  status={
                    lec.status === 'READY'
                      ? 'READY'
                      : lec.status === 'FAILED'
                      ? 'FAILED'
                      : 'TRANSCRIBING'
                  }
                  label={
                    lec.status === 'PROCESSING_STT'
                      ? `Transcribing ${(lec.progress ? lec.progress * 100 : 45).toFixed(0)}%`
                      : undefined
                  }
                />
              </View>

              <Text variant="title" style={styles.cardTitle}>
                {lec.title}
              </Text>

              <View style={styles.cardBottom}>
                <View style={styles.metaRow}>
                  <Feather name="clock" size={13} color={colors.text.muted} />
                  <Text variant="caption" color="muted" style={styles.metaText}>
                    {Math.floor(lec.durationSec / 60)} min · {lec.dateFormatted}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
              </View>
            </GlassCard>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterScroll: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  listContainer: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginBottom: spacing.base,
    letterSpacing: 0.5,
  },
  lectureCard: {
    marginBottom: spacing.base,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    marginBottom: spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  mascotIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    width: '100%',
  },
});
