import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  HomeTab: undefined;
  LibraryTab: { subjectId?: string } | undefined;
  ReviewTab: undefined;
  SearchTab: { q?: string } | undefined;
};

export type RootStackParamList = {
  // Auth & Onboarding
  Onboarding: undefined;
  SignIn: undefined;
  CreateAccount: undefined;

  // Main App Tabs
  Main: NavigatorScreenParams<MainTabParamList>;

  // Push Detail Screens
  LectureDetail: {
    lectureId: string;
    tab?: 'summary' | 'highlights' | 'transcript' | 'cards';
    atSec?: number;
  };
  Subjects: undefined;
  SubjectDetail: {
    subjectId: string;
  };
  Profile: undefined;
  Settings: undefined;
  Processing: {
    lectureId: string;
    jobId: string;
  };

  // Modal Screens
  AddAudioSheet: undefined;
  LiveRecording: {
    subjectId?: string;
  };
  FlashcardSession: {
    deckId?: string;
    lectureId?: string;
  };
  SessionComplete: {
    reviewedCards: number;
    streakDays: number;
    masteryPercentage: number;
  };
  Paywall: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
