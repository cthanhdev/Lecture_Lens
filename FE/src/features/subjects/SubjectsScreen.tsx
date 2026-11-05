import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
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
      header={<AppHeader variant="detail" title="Academic Subjects" />}
      contentContainerStyle={styles.container}
    >
      <Text variant="meta" color="muted" style={styles.sectionHeader}>
        ENROLLED COURSES ({subjects.length})
      </Text>

      {subjects.map((sub) => (
        <GlassCard
          key={sub.id}
          style={styles.card}
          padding="base"
          onPress={() =>
            navigation.navigate('SubjectDetail', { subjectId: sub.id })
          }
        >
          <View style={styles.cardTop}>
            <Chip label={sub.code} subjectKey={sub.colorKey} />
            <Text variant="caption" color="muted">
              {sub.term || 'Fall 2026'}
            </Text>
          </View>
          <Text variant="title" style={styles.name}>
            {sub.name}
          </Text>
          <Text variant="bodySm" color="secondary" style={styles.instructor}>
            {sub.instructor || 'Department Faculty'}
          </Text>
          <View style={styles.cardBottom}>
            <Text variant="caption" color="coralDeep" style={{ fontWeight: '700' }}>
              {sub.lectureCount} Lectures Recorded
            </Text>
            <Feather name="chevron-right" size={18} color={colors.text.muted} />
          </View>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.base,
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: spacing.base,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    marginBottom: 2,
  },
  instructor: {
    marginBottom: spacing.md,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
