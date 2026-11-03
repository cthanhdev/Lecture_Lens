import { useLectureStore } from '../src/shared/stores/useLectureStore';

describe('useLectureStore', () => {
  beforeEach(() => {
    useLectureStore.setState({
      activeFilter: 'all',
      searchQuery: '',
    });
  });

  it('filters lectures by status', () => {
    useLectureStore.getState().setFilter('ready');
    const readyLectures = useLectureStore.getState().getFilteredLectures();
    expect(readyLectures.length).toBeGreaterThan(0);
    readyLectures.forEach((lec) => {
      expect(lec.status).toBe('ready');
    });

    useLectureStore.getState().setFilter('processing');
    const processingLectures = useLectureStore.getState().getFilteredLectures();
    expect(processingLectures.length).toBeGreaterThan(0);
    processingLectures.forEach((lec) => {
      expect(lec.status).toBe('processing');
    });
  });

  it('filters lectures by search query', () => {
    useLectureStore.getState().setSearchQuery('Jacobian');
    const results = useLectureStore.getState().getFilteredLectures();
    expect(results.length).toBe(1);
    expect(results[0].title).toContain('Giải Tích 2');
  });

  it('toggles bookmark correctly', () => {
    const lectureId = 'lec_02';
    const initialBookmark = useLectureStore
      .getState()
      .lectures.find((l) => l.id === lectureId)?.isBookmarked;

    useLectureStore.getState().toggleBookmark(lectureId);
    const updatedBookmark = useLectureStore
      .getState()
      .lectures.find((l) => l.id === lectureId)?.isBookmarked;

    expect(updatedBookmark).toBe(!initialBookmark);
  });

  it('updates processing progress correctly and marks ready when complete', () => {
    const lectureId = 'lec_02';
    useLectureStore.getState().updateProgress(lectureId, 0.85);
    let lec = useLectureStore.getState().lectures.find((l) => l.id === lectureId);
    expect(lec?.processingProgress).toBe(0.85);
    expect(lec?.status).toBe('processing');

    useLectureStore.getState().updateProgress(lectureId, 1.0);
    lec = useLectureStore.getState().lectures.find((l) => l.id === lectureId);
    expect(lec?.processingProgress).toBe(1.0);
    expect(lec?.status).toBe('ready');
  });

  it('adds a new lecture and prepends it to the list', () => {
    const newLec = {
      id: 'lec_test_new',
      title: 'Bài Giảng Test Tự Động',
      subject: 'Kiểm Thử Phần Mềm',
      university: 'ĐH Bách Khoa',
      status: 'ready' as const,
      durationSeconds: 1200,
      relativeTime: 'Vừa xong',
    };
    useLectureStore.getState().addLecture(newLec);
    const firstLec = useLectureStore.getState().lectures[0];
    expect(firstLec.id).toBe('lec_test_new');
  });
});
