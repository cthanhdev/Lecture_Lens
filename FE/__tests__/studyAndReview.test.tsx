import React from 'react';
import { render } from '@testing-library/react-native';
import { SakuraBackdrop } from '../src/shared/components';
import { LectureDetailScreen } from '../src/features/lecture/LectureDetailScreen';
import { FlashcardSessionScreen } from '../src/features/study/FlashcardSessionScreen';
import { SessionCompleteScreen } from '../src/features/study/SessionCompleteScreen';
import { ReviewScreen } from '../src/features/review/ReviewScreen';
import { lectureRepo, studyRepo } from '../src/core/data';

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => React.createElement(View, { style }, children),
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      lectureId: 'lec-inflation',
      deckId: 'deck-macro',
      reviewedCards: 12,
      streakDays: 13,
      masteryPercentage: 85,
    },
  }),
}));

describe('Phase 7 & 8: Study, Flashcards & Review Hub Verification Suite', () => {
  describe('Delight Components', () => {
    it('renders SakuraBackdrop petals properly', async () => {
      const screen = await render(<SakuraBackdrop petalCount={6} />);
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  describe('Lecture Studio & Detail Screen', () => {
    it('renders LectureDetailScreen with capsule player, tabs, and summary', async () => {
      const screen = await render(<LectureDetailScreen />);
      expect(screen.getByText('Lecture Studio')).toBeTruthy();
      expect(screen.getByText('Summary')).toBeTruthy();
      expect(screen.getByText('Highlights')).toBeTruthy();
      expect(screen.getByText('Transcript')).toBeTruthy();
      expect(screen.getByText('Cards')).toBeTruthy();
      expect(screen.getByText('Ask AI Assistant')).toBeTruthy();
    });

    it('queries and receives AI answer with verifiable audio citations', async () => {
      const askResult = await lectureRepo.askQuestion(
        'lec-inflation',
        'What causes demand-pull inflation?'
      );

      expect(askResult).toBeDefined();
      expect(askResult.answer).toBeDefined();
      expect(askResult.answer.length).toBeGreaterThan(20);
      expect(askResult.citations).toBeDefined();
      expect(askResult.citations.length).toBeGreaterThan(0);
      expect(askResult.citations[0].startTime).toBeDefined();
      expect(askResult.citations[0].endTime).toBeDefined();
      expect(askResult.citations[0].textSnippet).toBeDefined();
    });
  });

  describe('Flashcard Active Recall & Spaced Repetition Session', () => {
    it('renders FlashcardSessionScreen with card question and action button', async () => {
      const screen = await render(<FlashcardSessionScreen />);
      expect(screen.getByText('Show Answer ➔')).toBeTruthy();
    });

    it('records flashcard review and updates card review interval in repository', async () => {
      const cards = await studyRepo.getFlashcards('deck-macro');
      expect(cards.length).toBeGreaterThan(0);

      const targetCard = cards[0];
      await studyRepo.recordCardReview(targetCard.id, 'GOOD');

      const updatedCards = await studyRepo.getFlashcards('deck-macro');
      const updatedCard = updatedCards.find((c) => c.id === targetCard.id);
      expect(updatedCard?.intervalDays).toBeGreaterThan(0);
    });

    it('renders SessionCompleteScreen with congrats and performance metrics', async () => {
      const screen = await render(<SessionCompleteScreen />);
      expect(screen.getByText('Session Mastered!')).toBeTruthy();
      expect(screen.getByText('CARDS')).toBeTruthy();
      expect(screen.getByText('STREAK')).toBeTruthy();
      expect(screen.getByText('MASTERY')).toBeTruthy();
      expect(screen.getByText('Back to Study Hub')).toBeTruthy();
    });
  });

  describe('Review Hub Screen', () => {
    it('renders ReviewScreen with due cards hero and active decks', async () => {
      const screen = await render(<ReviewScreen />);
      expect(screen.getByText('Review Hub')).toBeTruthy();
      expect(screen.getByText("Start today's review ▷")).toBeTruthy();
      expect(screen.getByText('To learn')).toBeTruthy();
      expect(screen.getByText('In progress')).toBeTruthy();
      expect(screen.getByText('Retained')).toBeTruthy();
    });
  });
});
