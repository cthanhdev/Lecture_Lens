import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../features/splash/SplashScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { LoginScreen, RegisterScreen } from '../features/auth/AuthScreens';
import { MainTabNavigator } from './MainTabNavigator';
import { UploadScreen } from '../features/upload/UploadScreen';
import { ProcessingScreen } from '../features/processing/ProcessingScreen';
import { LectureDetailScreen } from '../features/lecture_detail/LectureDetailScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Upload" component={UploadScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="LectureDetail" component={LectureDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
};
