import React from 'react';

jest.mock('react-native', () => ({
  StyleSheet: { create: (styles: any) => styles },
  Platform: { OS: 'ios', select: (objs: any) => objs.ios || objs.default },
  View: (props: any) => React.createElement('div', props, props.children),
  Text: (props: any) => React.createElement('span', props, props.children),
}));

import { AppColors } from '../src/core/theme/colors';
import { AppTypography } from '../src/core/theme/typography';
import {
  getWashiTapeBgColor,
  getWashiTapeTextColor,
} from '../src/shared/widgets/washi_tape/WashiTapeAccent';
import {
  filterLecturesList,
  selectLectures,
  selectActiveFilter,
  selectSearchQuery,
  selectSetFilter,
} from '../src/shared/stores/useLectureStore';
import { LectureUiModel } from '../src/shared/models/lecture.types';

const mockLectures: LectureUiModel[] = [
  {
    id: 'lec_1',
    title: 'Nhập môn Trí tuệ nhân tạo',
    subject: 'Khoa Học Máy Tính',
    status: 'ready',
    durationSeconds: 3000,
    relativeTime: '1 ngày trước',
    stickySnippet: 'Mô hình học sâu và mạng nơ-ron',
    tags: ['AI', 'NeuralNet'],
  },
  {
    id: 'lec_2',
    title: 'Hệ điều hành nâng cao',
    subject: 'Công nghệ phần mềm',
    status: 'processing',
    durationSeconds: 2400,
    relativeTime: 'Vừa xong',
    stickySnippet: 'Cơ chế đồng bộ hóa tiến trình Semaphore',
    tags: ['OS', 'Concurrency'],
  },
];

describe('Theme Palette & Dark Mode Tokens', () => {
  it('contains valid hex codes for dark mode surface and sticky notes', () => {
    // Validate hex format
    const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

    expect(AppColors.darkCanvas).toMatch(hexRegex);
    expect(AppColors.darkSurfaceCard).toMatch(hexRegex);
    expect(AppColors.darkSurfaceContainer).toMatch(hexRegex);
    expect(AppColors.darkPrimary).toMatch(hexRegex);
    expect(AppColors.darkOutline).toMatch(hexRegex);
    expect(AppColors.darkOnSurface).toMatch(hexRegex);
    expect(AppColors.darkOnSurfaceVariant).toMatch(hexRegex);
  });
});

describe('filterLecturesList', () => {

  it('filters by status correctly', () => {
    const readyOnly = filterLecturesList(mockLectures, 'ready', '');
    expect(readyOnly.length).toBe(1);
    expect(readyOnly[0].id).toBe('lec_1');

    const processingOnly = filterLecturesList(mockLectures, 'processing', '');
    expect(processingOnly.length).toBe(1);
    expect(processingOnly[0].id).toBe('lec_2');
  });

  it('filters by specific subject', () => {
    const csOnly = filterLecturesList(mockLectures, 'Khoa Học Máy Tính', '');
    expect(csOnly.length).toBe(1);
    expect(csOnly[0].id).toBe('lec_1');
  });

  it('filters by search query case-insensitively across title, snippet and tags', () => {
    const byTitle = filterLecturesList(mockLectures, 'all', 'trí TUỆ');
    expect(byTitle.length).toBe(1);
    expect(byTitle[0].id).toBe('lec_1');

    const bySnippet = filterLecturesList(mockLectures, 'all', 'semaphore');
    expect(bySnippet.length).toBe(1);
    expect(bySnippet[0].id).toBe('lec_2');

    const byTag = filterLecturesList(mockLectures, 'all', 'concurrency');
    expect(byTag.length).toBe(1);
    expect(byTag[0].id).toBe('lec_2');
  });

  it('returns empty array when query does not match anything', () => {
    const noMatch = filterLecturesList(mockLectures, 'all', 'Lịch sử văn minh thế giới');
    expect(noMatch.length).toBe(0);
  });

  it('handles edge cases: empty lectures, null tags or snippet, whitespace query', () => {
    expect(filterLecturesList([], 'all', 'test')).toEqual([]);
    expect(filterLecturesList(mockLectures, 'all', '   ')).toHaveLength(2);

    const lectureWithNoOptional: LectureUiModel = {
      id: 'lec_3',
      title: 'Đại số tuyến tính',
      subject: 'Toán',
      status: 'ready',
      durationSeconds: 1800,
      relativeTime: 'Hôm qua',
    };
    expect(filterLecturesList([lectureWithNoOptional], 'all', 'tuyến tính')).toHaveLength(1);
    expect(filterLecturesList([lectureWithNoOptional], 'all', 'snippet missing')).toHaveLength(0);
  });
});

describe('Store Selectors', () => {
  it('extracts correct state slices using atomic selectors', () => {
    const state = {
      lectures: mockLectures,
      activeFilter: 'ready',
      searchQuery: 'AI',
      setFilter: jest.fn(),
      setSearchQuery: jest.fn(),
      toggleBookmark: jest.fn(),
      addLecture: jest.fn(),
      updateProgress: jest.fn(),
      getFilteredLectures: jest.fn(),
    };

    expect(selectLectures(state as any)).toBe(mockLectures);
    expect(selectActiveFilter(state as any)).toBe('ready');
    expect(selectSearchQuery(state as any)).toBe('AI');
    expect(selectSetFilter(state as any)).toBe(state.setFilter);
  });
});

describe('FAB bottom calculation for safe area insets', () => {
  const computeFabBottom = (bottomInset: number) => Math.max(bottomInset, 12) + 72;

  it('computes correct bottom position on devices without notch (inset 0)', () => {
    expect(computeFabBottom(0)).toBe(84);
  });

  it('computes correct bottom position on iPhones with Home Indicator (inset 34)', () => {
    expect(computeFabBottom(34)).toBe(106);
  });

  it('computes correct bottom position on small insets (inset 8)', () => {
    expect(computeFabBottom(8)).toBe(84);
  });
});

describe('Sprint 3: WashiTapeAccent Color Tokens (E027)', () => {
  it('returns pastel yellow #FEF3C7 and deep brown #78350F for yellow tape', () => {
    expect(getWashiTapeBgColor('yellow')).toBe('#FEF3C7');
    expect(getWashiTapeTextColor('yellow')).toBe('#78350F');
  });

  it('returns correct tokens for other tape variants', () => {
    expect(getWashiTapeBgColor('mint')).toBe(AppColors.tertiaryFixed);
    expect(getWashiTapeTextColor('mint')).toBe(AppColors.onTertiaryFixedVariant);

    expect(getWashiTapeBgColor('lavender')).toBe(AppColors.primaryFixed);
    expect(getWashiTapeTextColor('lavender')).toBe(AppColors.primary);

    expect(getWashiTapeBgColor('sakura')).toBe(AppColors.secondaryFixed);
    expect(getWashiTapeTextColor('sakura')).toBe(AppColors.onSecondaryContainer);
  });
});

describe('Sprint 3: Typography Android Font Normalization (E025)', () => {
  it('does not have redundant fontWeight when font family specifies PostScript weight', () => {
    expect(AppTypography.displayLarge.fontWeight).toBeUndefined();
    expect(AppTypography.headlineLg.fontWeight).toBeUndefined();
    expect(AppTypography.headlineMedium.fontWeight).toBeUndefined();
    expect(AppTypography.bodyMedium.fontWeight).toBeUndefined();
    expect(AppTypography.labelLarge.fontWeight).toBeUndefined();
    expect(AppTypography.labelMedium.fontWeight).toBeUndefined();
  });
});
