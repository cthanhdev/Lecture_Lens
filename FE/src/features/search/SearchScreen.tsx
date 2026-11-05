import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import {
  Screen,
  AppHeader,
  LectureCard,
  EmptyState,
} from '../../shared/components';
import { Text, TextField, GlassCard, Chip, TimestampPill, IconButton } from '../../shared/ui';
import { lectureRepo, subjectRepo } from '../../core/data';
import { Lecture, Highlight, Subject } from '../../core/domain/types';

const RECENT_SEARCHES = [
  'Inflation',
  'Monetary policy',
  'Phillips curve',
  'Organic reaction',
  'M1 and M2 money supply',
];

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [query, setQuery] = useState(route.params?.q || '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();
  const [results, setResults] = useState<Lecture[]>([]);
  const [snippets, setSnippets] = useState<Highlight[]>([]);

  useEffect(() => {
    async function loadSubjects() {
      const subjs = await subjectRepo.getSubjects();
      setSubjects(subjs);
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    async function search() {
      const [lecs, hls] = await Promise.all([
        lectureRepo.getLectures({
          search: query.trim() || undefined,
          subjectId: selectedSubjectId,
        }),
        lectureRepo.getHighlights(),
      ]);

      setResults(lecs);

      const q = query.trim().toLowerCase();
      let filteredSnippets = hls;

      if (selectedSubjectId) {
        filteredSnippets = filteredSnippets.filter((h) => h.subjectId === selectedSubjectId);
      }

      if (q) {
        filteredSnippets = filteredSnippets.filter((h) =>
          h.quote.toLowerCase().includes(q)
        );
      }

      setSnippets(filteredSnippets);
    }
    search();
  }, [query, selectedSubjectId]);

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && results.length === 0 && snippets.length === 0;

  return (
    <Screen
      scrollable
      hasBottomBar
      header={<AppHeader variant="tab" subtitle="Instant Audio Search" title="Search" />}
    >
      {/* Search Input Bar */}
      <TextField
        placeholder="Search keywords, topics, timestamps..."
        value={query}
        onChangeText={setQuery}
        leftIcon={<Feather name="search" size={18} color={colors.text.muted} />}
        rightIcon={
          hasQuery ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          ) : undefined
        }
        containerStyle={styles.searchField}
      />

      {/* Subject Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Chip
          label="All Subjects"
          selected={!selectedSubjectId}
          onPress={() => setSelectedSubjectId(undefined)}
        />
        {subjects.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            subjectKey={s.colorKey}
            selected={selectedSubjectId === s.id}
            onPress={() =>
              setSelectedSubjectId(selectedSubjectId === s.id ? undefined : s.id)
            }
          />
        ))}
      </ScrollView>

      {/* When query is empty: Show Recent Searches */}
      {!hasQuery && (
        <View style={styles.suggestionsBox}>
          <Text variant="caption" color="muted" style={styles.suggestionsHeader}>
            FREQUENT TOPICS & RECENT SEARCHES
          </Text>
          <View style={styles.tagsCloud}>
            {RECENT_SEARCHES.map((term, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setQuery(term)}
                style={styles.suggestionTag}
              >
                <Feather name="clock" size={12} color={colors.text.muted} />
                <Text variant="bodySm" color="primary">
                  {term}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Empty State when search returns nothing */}
      {noResults ? (
        <EmptyState
          emoji="🔍"
          title="No results found"
          description={`We couldn't find any lectures or audio snippets matching "${query}". Try checking your spelling or searching for a broader term.`}
          actionTitle="Clear Search"
          onAction={() => setQuery('')}
        />
      ) : (
        <>
          {/* Snippet Audio Results */}
          {snippets.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="mic" size={14} color={colors.brand.primary} />
                <Text variant="meta" color="muted" style={styles.sectionTitle}>
                  AUDIO SNIPPETS ({snippets.length})
                </Text>
              </View>

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
                    <View style={styles.pillActionRow}>
                      <TimestampPill
                        timeStr={snip.atFormatted}
                        variant="primary"
                        onPress={() =>
                          navigation.navigate('LectureDetail', {
                            lectureId: snip.lectureId,
                            atSec: snip.atSec,
                          })
                        }
                      />
                      <IconButton
                        icon={<Feather name="play" size={14} color="#FFFFFF" />}
                        variant="coral"
                        size={32}
                        onPress={() =>
                          navigation.navigate('LectureDetail', {
                            lectureId: snip.lectureId,
                            atSec: snip.atSec,
                          })
                        }
                      />
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          {/* Lectures Matches */}
          {results.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="book-open" size={14} color={colors.text.secondary} />
                <Text variant="meta" color="muted" style={styles.sectionTitle}>
                  LECTURE RECORDINGS ({results.length})
                </Text>
              </View>

              {results.map((lec) => (
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
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchField: {
    marginVertical: spacing.sm,
  },
  filterScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  suggestionsBox: {
    marginBottom: spacing.lg,
  },
  suggestionsHeader: {
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  tagsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
  },
  resultCard: {
    marginBottom: spacing.base,
  },
  quote: {
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.base,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
