import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { colors } from '../core/theme';
import { useAuth } from '../core/auth';

// Navigators & Screens
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { CreateAccountScreen } from '../features/auth/CreateAccountScreen';
import { LectureDetailScreen } from '../features/lecture/LectureDetailScreen';
import { SubjectsScreen } from '../features/subjects/SubjectsScreen';
import { SubjectDetailScreen } from '../features/subjects/SubjectDetailScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { ProcessingScreen } from '../features/capture/ProcessingScreen';
import { AddAudioSheet } from '../features/capture/AddAudioSheet';
import { LiveRecordingScreen } from '../features/capture/LiveRecordingScreen';
import { FlashcardSessionScreen } from '../features/study/FlashcardSessionScreen';
import { SessionCompleteScreen } from '../features/study/SessionCompleteScreen';
import { PaywallScreen } from '../features/paywall/PaywallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading, hasCompletedOnboarding } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.canvas },
      }}
    >
      {user ? (
        // Authenticated Stack
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="LectureDetail" component={LectureDetailScreen} />
          <Stack.Screen name="Subjects" component={SubjectsScreen} />
          <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Processing" component={ProcessingScreen} />

          {/* Modal Screens */}
          <Stack.Group
            screenOptions={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.6],
              sheetGrabberVisible: true,
            }}
          >
            <Stack.Screen name="AddAudioSheet" component={AddAudioSheet} />
          </Stack.Group>

          <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
            <Stack.Screen name="LiveRecording" component={LiveRecordingScreen} />
            <Stack.Screen name="FlashcardSession" component={FlashcardSessionScreen} />
          </Stack.Group>

          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="SessionComplete" component={SessionCompleteScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </Stack.Group>
        </>
      ) : (
        // Unauthenticated Stack
        <>
          {!hasCompletedOnboarding && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
