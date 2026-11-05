import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import {
  Screen,
  AppHeader,
  LectureCard,
  EmptyState,
  OfflineBanner,
} from '../../shared/components';
import { Text, Chip, SegmentedControl } from '../../shared/ui';
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
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'ready'>('all');
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);

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

  // Filter lectures based on segmented control
  const filteredLectures = lectures.filter((lec) => {
    if (activeTab === 'ready') return lec.status === 'READY';
    if (activeTab === 'in_progress') return (lec.currentPlaybackSec || 0) > 0;
    return true;
  });

  // Group lectures into "Today" vs "Previous"
  const todayLectures = filteredLectures.filter(
    (l) => l.dateFormatted.toLowerCase().includes('today') || l.id === 'lec-inflation'
  );
  const olderLectures = filteredLectures.filter(
    (l) => !todayLectures.some((t) => t.id === l.id)
  );

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Archive" title="Library" />}
    >
      {showOfflineBanner && (
        <OfflineBanner
          onDismiss={() => setShowOfflineBanner(false)}
          onRetry={() => setShowOfflineBanner(false)}
        />
      )}

      {/* Segmented Control for fast filtering */}
      <SegmentedControl<'all' | 'in_progress' | 'ready'>
        options={[
          { key: 'all', label: 'All' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'ready', label: 'Ready' },
        ]}
        selectedKey={activeTab}
        onSelect={setActiveTab}
        style={styles.segmentedControl}
      />

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Chip
          label="All Subjects"
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
      {filteredLectures.length === 0 ? (
        <EmptyState
          emoji="🦊"
          title="No recordings found"
          description={
            selectedSubjectId
              ? "You haven't recorded any lectures for this course yet."
              : 'Record your first lecture or upload audio to start listening.'
          }
          actionTitle="Record a Lecture"
          actionIcon={<Feather name="mic" size={16} color="#FFFFFF" />}
          onAction={() => navigation.navigate('AddAudioSheet')}
          secondaryActionTitle={selectedSubjectId ? 'Show all subjects' : undefined}
          onSecondaryAction={
            selectedSubjectId ? () => setSelectedSubjectId(undefined) : undefined
          }
        />
      ) : (
        <View style={styles.listContainer}>
          {/* Today Group */}
          {todayLectures.length > 0 && (
            <View style={styles.groupSection}>
              <View style={styles.groupHeaderRow}>
                <Feather name="calendar" size={12} color={colors.text.muted} />
                <Text variant="meta" color="muted" style={styles.sectionTitle}>
                  TODAY ({todayLectures.length})
                </Text>
              </View>
              {todayLectures.map((lec) => (
                <LectureCard
                  key={lec.id}
                  lecture={lec}
                  onPress={() =>
                    navigation.navigate('LectureDetail', {
                      lectureId: lec.id,
                      atSec: lec.currentPlaybackSec || 0,
                    })
                  }
                  onPlayPress={() =>
                    navigation.navigate('LectureDetail', {
                      lectureId: lec.id,
                      atSec: lec.currentPlaybackSec || 0,
                    })
                  }
                />
              ))}
            </View>
          )}

          {/* Older / Last Week Group */}
          {olderLectures.length > 0 && (
            <View style={styles.groupSection}>
              <View style={styles.groupHeaderRow}>
                <Feather name="clock" size={12} color={colors.text.muted} />
                <Text variant="meta" color="muted" style={styles.sectionTitle}>
                  LAST WEEK & OLDER ({olderLectures.length})
                </Text>
              </View>
              {olderLectures.map((lec) => (
                <LectureCard
                  key={lec.id}
                  lecture={lec}
                  onPress={() =>
                    navigation.navigate('LectureDetail', {
                      lectureId: lec.id,
                      atSec: lec.currentPlaybackSec || 0,
                    })
                  }
                  onPlayPress={() =>
                    navigation.navigate('LectureDetail', {
                      lectureId: lec.id,
                      atSec: lec.currentPlaybackSec || 0,
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentedControl: {
    marginVertical: spacing.sm,
  },
  filterScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  groupSection: {
    marginBottom: spacing.md,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    letterSpacing: 0.8,
  },
});
