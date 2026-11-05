import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, radius, spacing, shadows } from '../../core/theme';
import { Screen, AppHeader, SakuraBackdrop } from '../../shared/components';
import { Text, GlassCard, ProgressBar, Button, Chip } from '../../shared/ui';
import { studyRepo } from '../../core/data';
import { Flashcard, FlashcardGrade } from '../../core/domain/types';

export function FlashcardSessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { deckId = 'deck-macro' } = route.params || {};

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [goodCount, setGoodCount] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const data = await studyRepo.getFlashcards(deckId);
      setCards(data);
    }
    load();
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handleGrade = async (grade: FlashcardGrade) => {
    if (currentCard) {
      await studyRepo.recordCardReview(currentCard.id, grade);
    }

    if (grade === 'GOOD' || grade === 'EASY') {
      setGoodCount((g) => g + 1);
    }

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Completed session
      const total = cards.length || 1;
      const finalMastery = Math.round(((goodCount + 1) / total) * 100);
      navigation.replace('SessionComplete', {
        reviewedCards: cards.length,
        streakDays: 13,
        masteryPercentage: Math.max(finalMastery, 80),
      });
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Macroeconomics"
          subtitle={`${currentIndex + 1} / ${cards.length || 1} Cards`}
          onClosePress={() => navigation.goBack()}
        />
      }
      contentContainerStyle={styles.container}
    >
      <SakuraBackdrop petalCount={4} />

      {/* Progress Bar */}
      <ProgressBar
        progress={(currentIndex + 1) / (cards.length || 1)}
        height={6}
        style={styles.progressBar}
      />

      {/* Main Flashcard Tile */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => setIsFlipped((f) => !f)}
        style={styles.cardTouchWrapper}
      >
        <GlassCard variant="frosted" padding="xl" style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Chip
              label={isFlipped ? 'ANSWER' : 'QUESTION'}
              subjectKey="macroeconomics"
            />
            <Text variant="caption" color="muted">
              Card {currentIndex + 1} of {cards.length || 1}
            </Text>
          </View>

          <View style={styles.cardBody}>
            {!isFlipped ? (
              <View style={styles.questionSection}>
                <Text variant="h2" center style={styles.cardQuestion}>
                  {currentCard?.question || 'What is cost-push inflation?'}
                </Text>

                {showHint && currentCard?.hint && (
                  <View style={styles.hintBox}>
                    <Feather name="info" size={14} color={colors.brand.primary} />
                    <Text variant="bodySm" color="secondary" style={styles.hintText}>
                      Hint: {currentCard.hint}
                    </Text>
                  </View>
                )}

                {currentCard?.sourceContext && (
                  <View style={styles.sourceBox}>
                    <Feather name="book-open" size={12} color={colors.text.muted} />
                    <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>
                      Context: {currentCard.sourceContext}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.answerSection}>
                <Text variant="bodyLg" center style={styles.cardAnswer}>
                  {currentCard?.answer || 'Cost-push inflation occurs when aggregate supply decreases due to higher costs of production.'}
                </Text>

                {currentCard?.sourceContext && (
                  <View style={styles.sourceBox}>
                    <Feather name="file-text" size={13} color={colors.brand.primary} />
                    <Text variant="caption" color="coralDeep" style={{ marginLeft: 4 }}>
                      Source: {currentCard.sourceContext}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            {!isFlipped && (
              <Button
                title={showHint ? 'Hide Hint' : 'Peek Hint'}
                variant="ghost"
                size="sm"
                onPress={() => setShowHint((h) => !h)}
                icon={<Feather name="help-circle" size={14} color={colors.brand.primary} />}
              />
            )}
            <Text variant="caption" color="muted" center>
              {isFlipped ? 'Tap anywhere to view question' : 'Tap anywhere to flip card'}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>

      {/* Action Buttons */}
      {!isFlipped ? (
        <Button
          title="Show Answer ➔"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => setIsFlipped(true)}
          style={[styles.bottomBtn, shadows.coralGlow]}
        />
      ) : (
        <View style={styles.gradeButtonsRow}>
          <TouchableOpacity
            style={[styles.gradePill, styles.againPill]}
            onPress={() => handleGrade('AGAIN')}
          >
            <Text variant="label" style={{ color: palette.errorRed }}>
              Again
            </Text>
            <Text variant="caption" style={{ color: palette.errorRed, fontSize: 10 }}>
              1 day
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gradePill, styles.hardPill]}
            onPress={() => handleGrade('HARD')}
          >
            <Text variant="label" style={{ color: colors.text.secondary }}>
              Hard
            </Text>
            <Text variant="caption" style={{ color: colors.text.muted, fontSize: 10 }}>
              3 days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gradePill, styles.goodPill]}
            onPress={() => handleGrade('GOOD')}
          >
            <Text variant="label" style={{ color: '#FFFFFF' }}>
              Good
            </Text>
            <Text variant="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>
              7 days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gradePill, styles.easyPill]}
            onPress={() => handleGrade('EASY')}
          >
            <Text variant="label" style={{ color: palette.mintDeep }}>
              Easy
            </Text>
            <Text variant="caption" style={{ color: palette.mintDeep, fontSize: 10 }}>
              14 days
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  progressBar: {
    marginVertical: spacing.md,
  },
  cardTouchWrapper: {
    flex: 1,
    marginVertical: spacing.base,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 380,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  questionSection: {
    alignItems: 'center',
    width: '100%',
  },
  cardQuestion: {
    lineHeight: 30,
    marginBottom: spacing.base,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 127, 114, 0.1)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginVertical: spacing.sm,
  },
  hintText: {
    marginLeft: 6,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  answerSection: {
    alignItems: 'center',
    width: '100%',
  },
  cardAnswer: {
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  cardFooter: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.base,
  },
  bottomBtn: {
    marginTop: spacing.base,
  },
  gradeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  gradePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  againPill: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  hardPill: {
    backgroundColor: 'rgba(255, 226, 122, 0.2)',
    borderColor: 'rgba(255, 226, 122, 0.5)',
  },
  goodPill: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  easyPill: {
    backgroundColor: 'rgba(190, 225, 208, 0.4)',
    borderColor: 'rgba(10, 67, 37, 0.2)',
  },
});
