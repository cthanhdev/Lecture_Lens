import { RootNavigator, MainTabNavigator } from '../src/navigation';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { LibraryScreen } from '../src/features/library/LibraryScreen';
import { ReviewScreen } from '../src/features/review/ReviewScreen';
import { SearchScreen } from '../src/features/search/SearchScreen';
import { LectureDetailScreen } from '../src/features/lecture/LectureDetailScreen';
import { LiveRecordingScreen } from '../src/features/capture/LiveRecordingScreen';
import { FlashcardSessionScreen } from '../src/features/study/FlashcardSessionScreen';

describe('Navigation & App Shell Verification Suite', () => {
  it('exports valid RootNavigator and MainTabNavigator components', () => {
    expect(RootNavigator).toBeDefined();
    expect(typeof RootNavigator).toBe('function');

    expect(MainTabNavigator).toBeDefined();
    expect(typeof MainTabNavigator).toBe('function');
  });

  it('exports all core feature route screens as valid React components', () => {
    expect(HomeScreen).toBeDefined();
    expect(LibraryScreen).toBeDefined();
    expect(ReviewScreen).toBeDefined();
    expect(SearchScreen).toBeDefined();
    expect(LectureDetailScreen).toBeDefined();
    expect(LiveRecordingScreen).toBeDefined();
    expect(FlashcardSessionScreen).toBeDefined();
  });
});
