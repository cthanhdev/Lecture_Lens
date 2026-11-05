import {
  User,
  Subject,
  Lecture,
  Highlight,
  TranscriptSegment,
  LectureSummary,
  Flashcard,
  Deck,
  StudyStats,
  AskAnswer,
  FlashcardGrade,
  JobStatus,
} from '../domain/types';

export interface AuthRepository {
  login(email: string, password: string): Promise<{ user: User; token: string }>;
  register(fullName: string, email: string, password: string): Promise<{ user: User; token: string }>;
  loginAsGuest(): Promise<{ user: User; token: string }>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
}

export interface LectureRepository {
  getLectures(params?: { subjectId?: string; search?: string }): Promise<Lecture[]>;
  getLectureById(id: string): Promise<Lecture | null>;
  getContinueListening(): Promise<Lecture | null>;
  getSummary(lectureId: string): Promise<LectureSummary>;
  getHighlights(lectureId?: string): Promise<Highlight[]>;
  getTranscript(lectureId: string): Promise<TranscriptSegment[]>;
  uploadAudio(input: { title: string; subjectId: string; uri: string }): Promise<{ lecture: Lecture; jobId: string }>;
  getJobStatus(jobId: string): Promise<{ status: JobStatus; progress: number }>;
  askQuestion(lectureId: string, query: string): Promise<AskAnswer>;
  createHighlight(lectureId: string, quote: string, atSec: number): Promise<Highlight>;
}

export interface SubjectRepository {
  getSubjects(): Promise<Subject[]>;
  getSubjectById(id: string): Promise<Subject | null>;
}

export interface StudyRepository {
  getDecks(): Promise<Deck[]>;
  getDeckById(id: string): Promise<Deck | null>;
  getStudyStats(): Promise<StudyStats>;
  getFlashcards(deckId?: string): Promise<Flashcard[]>;
  recordCardReview(cardId: string, grade: FlashcardGrade): Promise<void>;
}
