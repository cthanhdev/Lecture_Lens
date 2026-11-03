import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LectureUiModel, LectureStatus, MOCK_LECTURES } from '../models/lecture.types';

export interface LectureState {
  lectures: LectureUiModel[];
  activeFilter: 'all' | 'ready' | 'processing' | string;
  searchQuery: string;
  setFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: (lectureId: string) => void;
  addLecture: (lecture: LectureUiModel) => void;
  updateProgress: (id: string, progress: number, status?: LectureStatus) => void;
  getFilteredLectures: () => LectureUiModel[];
}

export const useLectureStore = create<LectureState>()(
  persist(
    (set, get) => ({
      lectures: MOCK_LECTURES,
      activeFilter: 'all',
      searchQuery: '',

      setFilter: (filter) => set({ activeFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleBookmark: (lectureId) =>
        set((state) => ({
          lectures: state.lectures.map((lec) =>
            lec.id === lectureId ? { ...lec, isBookmarked: !lec.isBookmarked } : lec
          ),
        })),

      addLecture: (lecture) =>
        set((state) => ({
          lectures: [lecture, ...state.lectures],
        })),

      updateProgress: (id, progress, status = 'processing') =>
        set((state) => ({
          lectures: state.lectures.map((lec) =>
            lec.id === id
              ? {
                  ...lec,
                  processingProgress: progress,
                  status: progress >= 1 ? 'ready' : status,
                }
              : lec
          ),
        })),

      getFilteredLectures: () => {
        const { lectures, activeFilter, searchQuery } = get();
        return filterLecturesList(lectures, activeFilter, searchQuery);
      },
    }),
    {
      name: 'll-lecture-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lectures: state.lectures,
        activeFilter: state.activeFilter,
      }),
    }
  )
);

// Pure helper function for filtering
export function filterLecturesList(
  lectures: LectureUiModel[],
  filter: string,
  searchQuery: string
): LectureUiModel[] {
  const query = searchQuery.trim().toLowerCase();
  return lectures.filter((lec) => {
    // Filter by tab / status
    if (filter === 'ready' && lec.status !== 'ready') return false;
    if (filter === 'processing' && lec.status !== 'processing') return false;
    if (filter !== 'all' && filter !== 'ready' && filter !== 'processing') {
      if (lec.subject !== filter) return false;
    }
    // Filter by search query
    if (query.length > 0) {
      const matchesTitle = lec.title.toLowerCase().includes(query);
      const matchesSubject = lec.subject.toLowerCase().includes(query);
      const matchesTags = lec.tags?.some((t) => t.toLowerCase().includes(query));
      const matchesSnippet = lec.stickySnippet?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesSubject && !matchesTags && !matchesSnippet) return false;
    }
    return true;
  });
}

// Selectors for optimized Zustand subscriptions
export const selectLectures = (state: LectureState) => state.lectures;
export const selectActiveFilter = (state: LectureState) => state.activeFilter;
export const selectSearchQuery = (state: LectureState) => state.searchQuery;
export const selectSetFilter = (state: LectureState) => state.setFilter;
export const selectSetSearchQuery = (state: LectureState) => state.setSearchQuery;
export const selectToggleBookmark = (state: LectureState) => state.toggleBookmark;
export const selectAddLecture = (state: LectureState) => state.addLecture;
export const selectUpdateProgress = (state: LectureState) => state.updateProgress;

// Custom memoized hook to fetch filtered lectures
export const useLecturesList = (customFilter?: string, customQuery?: string) => {
  const lectures = useLectureStore(selectLectures);
  const activeFilter = useLectureStore(selectActiveFilter);
  const searchQuery = useLectureStore(selectSearchQuery);

  const filterToUse = customFilter !== undefined ? customFilter : activeFilter;
  const queryToUse = customQuery !== undefined ? customQuery : searchQuery;

  return useMemo(() => {
    return filterLecturesList(lectures, filterToUse, queryToUse);
  }, [lectures, filterToUse, queryToUse]);
};
