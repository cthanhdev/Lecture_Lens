import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip } from '../../shared/ui';
import { subjectRepo } from '../../core/data';
import { Subject } from '../../core/domain/types';

export function SubjectsScreen() {
  const navigation = useNavigation<any>();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    async function load() {
      const data = await subjectRepo.getSubjects();
      setSubjects(data);
    }
    load();
  }, []);

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Academic Courses" />}
    >
      <View style={styles.headerInfo}>
        <Text variant="caption" color="muted" style={styles.sectionHeader}>
          ENROLLED COURSES ({subjects.length})
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LibraryTab')}
          style={styles.allLink}
        >
          <Text variant="label" color="primary">
            View All in Library →
          </Text>
        </TouchableOpacity>
      </View>

      {subjects.map((sub) => (
        <GlassCard
          key={sub.id}
          style={styles.card}
          padding="lg"
          onPress={() =>
            navigation.navigate('SubjectDetail', { subjectId: sub.id })
          }
        >
          <View style={styles.cardTop}>
            <Chip label={sub.code} subjectKey={sub.colorKey} />
            <View style={styles.termBadge}>
              <Text variant="caption" color="muted">
                {sub.term || 'Fall 2026'}
              </Text>
            </View>
          </View>

          <Text variant="h3" style={styles.name}>
            {sub.name}
          </Text>

          <Text variant="bodySm" color="secondary" style={styles.instructor}>
            {sub.instructor || 'Department Faculty'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.cardBottom}>
            <View style={styles.statsRow}>
              <Feather name="mic" size={13} color={colors.brand.primary} />
              <Text variant="label" color="coralDeep">
                {sub.lectureCount} Lectures Recorded
              </Text>
            </View>
            <View style={styles.arrowCircle}>
              <Feather name="arrow-right" size={14} color={colors.brand.primary} />
            </View>
          </View>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  sectionHeader: {
    letterSpacing: 0.5,
  },
  allLink: {
    paddingVertical: 2,
  },
  card: {
    marginBottom: spacing.base,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  termBadge: {
    backgroundColor: 'rgba(38, 19, 51, 0.04)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  name: {
    marginBottom: 4,
  },
  instructor: {
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
