import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Library: undefined;
  Search: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Upload: undefined;
  Processing: { lectureId: string };
  LectureDetail: { lectureId: string; initialTabIndex?: number };
  Notifications: undefined;
};
