import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, ProgressBar, Button, Chip } from '../../shared/ui';
import { studyRepo } from '../../core/data';
import { Flashcard, FlashcardGrade } from '../../core/domain/types';

export function FlashcardSessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { deckId = 'deck-macro' } = route.params || {};

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

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

    if (currentIndex < cards.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Completed session
      navigation.replace('SessionComplete', {
        reviewedCards: cards.length,
        streakDays: 13,
        masteryPercentage: 82,
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
              {currentIndex + 1} of {cards.length}
            </Text>
          </View>

          <View style={styles.cardBody}>
            {!isFlipped ? (
              <>
                <Text variant="h2" center style={styles.cardQuestion}>
                  {currentCard?.question || 'What is cost-push inflation?'}
                </Text>
                {showHint && currentCard?.hint && (
                  <View style={styles.hintBox}>
                    <Feather name="info" size={14} color={colors.brand.primary} />
                    <Text variant="bodySm" color="secondary" style={{ marginLeft: 6 }}>
                      {currentCard.hint}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text variant="bodyLg" center style={styles.cardAnswer}>
                  {currentCard?.answer || 'Recall how aggregate supply shifts when input factors become scarcer.'}
                </Text>
                {currentCard?.sourceContext && (
                  <View style={styles.sourceBox}>
                    <Feather name="file-text" size={13} color={colors.text.muted} />
                    <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>
                      Source: {currentCard.sourceContext}
                    </Text>
                  </View>
                )}
              </>
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
              {isFlipped ? 'Tap anywhere to review question' : 'Tap card anywhere to flip'}
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
          style={styles.bottomBtn}
        />
      ) : (
        <View style={styles.gradeButtonsRow}>
          <Button
            title="Again"
            variant="glass"
            size="md"
            onPress={() => handleGrade('AGAIN')}
            style={styles.gradeBtn}
          />
          <Button
            title="Hard"
            variant="glass"
            size="md"
            onPress={() => handleGrade('HARD')}
            style={styles.gradeBtn}
          />
          <Button
            title="Good"
            variant="primary"
            size="md"
            onPress={() => handleGrade('GOOD')}
            style={styles.gradeBtn}
          />
          <Button
            title="Easy"
            variant="secondary"
            size="md"
            onPress={() => handleGrade('EASY')}
            style={styles.gradeBtn}
          />
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
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  cardQuestion: {
    lineHeight: 30,
  },
  cardAnswer: {
    lineHeight: 24,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primarySoft,
    padding: spacing.base,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  cardFooter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomBtn: {
    marginTop: spacing.base,
  },
  gradeButtonsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.base,
  },
  gradeBtn: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
