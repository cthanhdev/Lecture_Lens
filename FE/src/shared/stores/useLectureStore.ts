import { create } from 'zustand';
import { LectureUiModel, LectureStatus, MOCK_LECTURES } from '../models/lecture.types';

interface LectureState {
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

export const useLectureStore = create<LectureState>((set, get) => ({
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
    return lectures.filter((lec) => {
      // Filter by tab
      if (activeFilter === 'ready' && lec.status !== 'ready') return false;
      if (activeFilter === 'processing' && lec.status !== 'processing') return false;
      if (activeFilter !== 'all' && activeFilter !== 'ready' && activeFilter !== 'processing') {
        if (lec.subject !== activeFilter) return false;
      }
      // Filter by search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = lec.title.toLowerCase().includes(q);
        const matchesSubject = lec.subject.toLowerCase().includes(q);
        const matchesTags = lec.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesSnippet = lec.stickySnippet?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesTags && !matchesSnippet) return false;
      }
      return true;
    });
  },
}));
