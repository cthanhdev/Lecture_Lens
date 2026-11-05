import { SubjectKey } from '../theme';

export type JobStatus =
  | 'QUEUED'
  | 'PROCESSING_STT'
  | 'CHUNKING'
  | 'EMBEDDING'
  | 'READY'
  | 'FAILED';

export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string;
  university?: string;
  major?: string;
  year?: string;
  isPlusSubscriber?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string; // e.g. "ECON 201"
  colorKey: SubjectKey;
  lectureCount: number;
  instructor?: string;
  term?: string;
}

export interface Lecture {
  id: string;
  title: string;
  chapterTitle?: string;
  subjectId: string;
  subjectName: string;
  subjectKey: SubjectKey;
  durationSec: number;
  currentPlaybackSec?: number;
  createdAt: string;
  dateFormatted: string; // e.g. "Nov 3"
  status: JobStatus;
  progress?: number; // 0.0 to 1.0 (for processing/transcribing)
  audioUri?: string;
  fileSizeFormatted?: string;
}

export interface Highlight {
  id: string;
  lectureId: string;
  subjectId: string;
  subjectName: string;
  subjectKey: SubjectKey;
  quote: string;
  atSec: number;
  atFormatted: string; // e.g. "12:41"
  isBookmarked?: boolean;
  note?: string;
}

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  timestampFormatted: string; // "[12:40]"
  speaker?: string; // "Prof. Henderson"
  text: string;
  isKeyIdea?: boolean;
}

export interface DefinitionItem {
  id: string;
  term: string;
  body: string;
  atSec: number;
  atFormatted: string;
}

export interface KeywordItem {
  id: string;
  term: string;
  count: number;
}

export interface ExamQuestionItem {
  id: string;
  question: string;
  tag: string; // e.g. "Midterm staple"
  points: number; // e.g. 10
}

export interface LectureSummary {
  lectureId: string;
  keyIdeas: string[];
  keywords: KeywordItem[];
  definitions: DefinitionItem[];
  examQuestions: ExamQuestionItem[];
}

export type FlashcardGrade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface Flashcard {
  id: string;
  deckId: string;
  lectureId?: string;
  question: string;
  answer: string;
  hint?: string;
  sourceContext?: string; // e.g. "Lecture 7 · 12:41"
  sourceSec?: number;
  intervalDays?: number;
  dueToday?: boolean;
}

export interface Deck {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectKey: SubjectKey;
  title: string;
  cardCount: number;
  dueCount: number;
  masteryPercentage: number; // 0..100
}

export interface StudyStats {
  cardsDueToday: number;
  estimatedMinutes: number;
  streakDays: number;
  streakActiveToday: boolean;
  reviewedCardsCount: number;
  toLearnCount: number;
  inProgressCount: number;
  retainedCount: number;
  weeklyMomentumDays: { day: string; count: number; isToday: boolean }[];
  consistencyPercentile: number; // e.g. 5 (Top 5% consistency)
}

export interface Citation {
  chunkId: string;
  startTime: string; // "12:40"
  endTime: string;   // "14:15"
  textSnippet: string;
}

export interface AskAnswer {
  answer: string;
  citations: Citation[];
}
