import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, TextField, GlassCard, Chip, TimestampPill } from '../../shared/ui';
import { lectureRepo } from '../../core/data';
import { Lecture, Highlight } from '../../core/domain/types';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [query, setQuery] = useState(route.params?.q || '');
  const [results, setResults] = useState<Lecture[]>([]);
  const [snippets, setSnippets] = useState<Highlight[]>([]);

  useEffect(() => {
    async function search() {
      const [lecs, hls] = await Promise.all([
        lectureRepo.getLectures({ search: query }),
        lectureRepo.getHighlights(),
      ]);
      setResults(lecs);
      const filteredSnippets = query.trim()
        ? hls.filter((h) => h.quote.toLowerCase().includes(query.toLowerCase()))
        : hls;
      setSnippets(filteredSnippets);
    }
    search();
  }, [query]);

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Instant Audio Search" title="Search" />}
    >
      <TextField
        placeholder="Search keywords, topics, timestamps..."
        value={query}
        onChangeText={setQuery}
        leftIcon={<Feather name="search" size={18} color={colors.text.muted} />}
        containerStyle={styles.searchField}
      />

      {/* Snippet Audio Results */}
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        AUDIO SNIPPETS ({snippets.length})
      </Text>

      {snippets.map((snip) => (
        <GlassCard
          key={snip.id}
          style={styles.resultCard}
          padding="base"
          onPress={() =>
            navigation.navigate('LectureDetail', {
              lectureId: snip.lectureId,
              atSec: snip.atSec,
            })
          }
        >
          <Text variant="bodySemibold" style={styles.quote}>
            “{snip.quote}”
          </Text>
          <View style={styles.cardFooter}>
            <Chip label={snip.subjectName} subjectKey={snip.subjectKey} />
            <TimestampPill timeStr={snip.atFormatted} variant="primary" />
          </View>
        </GlassCard>
      ))}

      {/* Lectures Matches */}
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        LECTURE MATCHES ({results.length})
      </Text>

      {results.map((lec) => (
        <GlassCard
          key={lec.id}
          style={styles.resultCard}
          padding="base"
          onPress={() =>
            navigation.navigate('LectureDetail', {
              lectureId: lec.id,
              atSec: lec.currentPlaybackSec || 0,
            })
          }
        >
          <View style={styles.cardHeader}>
            <Chip label={lec.subjectName} subjectKey={lec.subjectKey} />
            <Text variant="caption" color="muted">
              {Math.floor(lec.durationSec / 60)} min
            </Text>
          </View>
          <Text variant="title" style={styles.title}>
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
  searchField: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.base,
    letterSpacing: 0.5,
  },
  resultCard: {
    marginBottom: spacing.base,
  },
  quote: {
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    marginBottom: 2,
  },
});
