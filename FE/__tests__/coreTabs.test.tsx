import React from 'react';
import { render } from '@testing-library/react-native';
import {
  EmptyState,
  OfflineBanner,
  LectureCard,
  WaveformVisualizer,
} from '../src/shared/components';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { LibraryScreen } from '../src/features/library/LibraryScreen';
import { SearchScreen } from '../src/features/search/SearchScreen';
import { SubjectsScreen } from '../src/features/subjects/SubjectsScreen';
import { SubjectDetailScreen } from '../src/features/subjects/SubjectDetailScreen';
import { lectureRepo, subjectRepo, studyRepo } from '../src/core/data';
import { Lecture } from '../src/core/domain/types';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

const mockLecture: Lecture = {
  id: 'lec-inflation',
  title: 'Lecture 7: Inflation & Monetary Policy',
  chapterTitle: 'Chapter 4 · Demand-pull vs Cost-push',
  subjectId: 'subj-macro',
  subjectName: 'Macroeconomics',
  subjectKey: 'macroeconomics',
  durationSec: 2900,
  currentPlaybackSec: 1798,
  createdAt: '2026-11-03T09:00:00Z',
  dateFormatted: 'Nov 3',
  status: 'READY',
  fileSizeFormatted: '48.2 MB',
};

describe('Phase 5: Core Hub Screens (Home, Library, Search, Subjects)', () => {
  describe('Shared Hub Components', () => {
    it('renders EmptyState with custom title, description, and action button', async () => {
      const onAction = jest.fn();
      const screen = await render(
        <EmptyState
          emoji="🦊"
          title="No recordings found"
          description="Record your first lecture to get started."
          actionTitle="Record Now"
          onAction={onAction}
        />
      );

      expect(screen.getByText('No recordings found')).toBeTruthy();
      expect(screen.getByText('Record your first lecture to get started.')).toBeTruthy();
      expect(screen.getByText('Record Now')).toBeTruthy();
    });

    it('renders OfflineBanner with offline notice', async () => {
      const screen = await render(
        <OfflineBanner message="Offline mode • Accessing cached lectures" />
      );
      expect(screen.getByText('Offline mode • Accessing cached lectures')).toBeTruthy();
    });

    it('renders LectureCard in both vertical and horizontal variants', async () => {
      const screen = await render(
        <LectureCard lecture={mockLecture} variant="vertical" />
      );
      expect(screen.getByText('Lecture 7: Inflation & Monetary Policy')).toBeTruthy();
      expect(screen.getByText('Chapter 4 · Demand-pull vs Cost-push')).toBeTruthy();

      await screen.rerender(<LectureCard lecture={mockLecture} variant="horizontal" />);
      expect(screen.getByText('Lecture 7: Inflation & Monetary Policy')).toBeTruthy();
    });

    it('renders WaveformVisualizer with progress', async () => {
      const screen = await render(
        <WaveformVisualizer progress={0.5} barCount={20} height={32} />
      );
      expect(screen.toJSON()).toBeTruthy();
    });
  });

  describe('Core Tab Screens Definition', () => {
    it('exports all Phase 5 screen components properly', () => {
      expect(HomeScreen).toBeDefined();
      expect(LibraryScreen).toBeDefined();
      expect(SearchScreen).toBeDefined();
      expect(SubjectsScreen).toBeDefined();
      expect(SubjectDetailScreen).toBeDefined();
    });
  });

  describe('Core Data & Hub Repositories Integration', () => {
    it('retrieves Continue Listening lecture matching Figma Lecture 7', async () => {
      const continueLec = await lectureRepo.getContinueListening();
      expect(continueLec).toBeDefined();
      expect(continueLec?.title).toContain('Inflation');
      expect(continueLec?.subjectName).toBe('Macroeconomics');
    });

    it('filters lectures by subject in Library', async () => {
      const allLecs = await lectureRepo.getLectures();
      expect(allLecs.length).toBeGreaterThan(0);

      const macroLecs = await lectureRepo.getLectures({ subjectId: 'subj-macro' });
      expect(macroLecs.length).toBeGreaterThan(0);
      expect(macroLecs.every((l) => l.subjectId === 'subj-macro')).toBe(true);

      const emptyLecs = await lectureRepo.getLectures({ subjectId: 'non-existent' });
      expect(emptyLecs.length).toBe(0);
    });

    it('searches lectures and audio highlights by keyword in Search tab', async () => {
      const searchResults = await lectureRepo.getLectures({ search: 'inflation' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].title.toLowerCase()).toContain('inflation');

      const highlights = await lectureRepo.getHighlights();
      const matchingHighlights = highlights.filter((h) =>
        h.quote.toLowerCase().includes('inflation')
      );
      expect(matchingHighlights.length).toBeGreaterThan(0);
      expect(matchingHighlights[0].atFormatted).toBeDefined();
    });

    it('fetches courses and course decks for Subjects detail', async () => {
      const subjects = await subjectRepo.getSubjects();
      expect(subjects.length).toBe(4);
      expect(subjects.map((s) => s.code)).toContain('ECON 201');

      const decks = await studyRepo.getDecks();
      expect(decks.length).toBe(4);
      expect(decks.some((d) => d.subjectName === 'Macroeconomics')).toBe(true);
    });
  });
});
