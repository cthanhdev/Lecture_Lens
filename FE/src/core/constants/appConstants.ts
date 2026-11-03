/**
 * Hằng số toàn cục cho LectureLens (Tên app, routes, metadata)
 */
export const AppConstants = {
  appName: 'LectureLens',
  appTagline: 'Biến bài giảng thành kho kiến thức',
  appVersion: '1.0.0 (Beta)',

  // Routes
  routeSplash: 'Splash',
  routeSplashAi: 'SplashAi',
  routeSplashLoad: 'SplashLoad',
  routeSplashSlow: 'SplashSlow',
  routeSplashError: 'SplashError',
  routeOnboarding: 'Onboarding',
  routeLogin: 'Login',
  routeRegister: 'Register',
  routeMainTabs: 'MainTabs',
  routeLibrary: 'Library',
  routeUpload: 'Upload',
  routeProcessing: 'Processing',
  routeLectureDetail: 'LectureDetail',
  routeSearch: 'Search',
  routeNotifications: 'Notifications',
  routeSettings: 'Settings',
  routeNotFound: 'NotFound',
} as const;
