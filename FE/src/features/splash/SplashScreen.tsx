import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppConstants } from '../../core/constants/appConstants';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useAppStore } from '../../shared/stores/useAppStore';

type SplashScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export const SplashScreen = ({ navigation }: SplashScreenProps) => {
  const { colors } = useAppTheme();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const [loadingProgress] = useState(new Animated.Value(0.1));

  useEffect(() => {
    // Animate the loading progress bar
    Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        navigation.replace('MainTabs', { screen: 'Library' });
      } else {
        navigation.replace('Onboarding');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, loadingProgress, navigation]);

  const progressWidth = loadingProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });

  return (
    <DotBackground>
      <View style={styles.container}>
        {/* Decorative Top Washi Tape */}
        <View style={styles.topWashiWrapper}>
          <WashiTapeAccent color="sakura" width={80} height={12} rotation="-2deg" />
        </View>

        {/* Central Visual Area: Glow Aura & Star-Eyes Mascot */}
        <View style={styles.centerBox}>
          {/* Ambient Radiant Glow */}
          <View style={styles.glowAura} />

          <View style={styles.mascotWrapper}>
            <CuMeoWidget variant="star_eyes" size={190} />
          </View>

          {/* App Brand Name */}
          <Text style={[AppTypography.headlineLg, styles.brandTitle, { color: colors.primary }]}>
            LectureLens
          </Text>

          <Text style={[AppTypography.bodyMedium, styles.tagline, { color: colors.textSecondary }]}>
            Đang đánh thức Cú Mèo & chuẩn bị bài giảng...
          </Text>

          {/* Elegant Stationery Loading Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: AppColors.surfaceContainer }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                  backgroundColor: AppColors.primaryContainer,
                },
              ]}
            />
          </View>
        </View>

        {/* Footer Version Info */}
        <View style={styles.footer}>
          <Text style={[AppTypography.labelSmall, { color: colors.textSecondary, opacity: 0.7 }]}>
            v{AppConstants.appVersion} • Bàn học thông minh
          </Text>
        </View>
      </View>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  topWashiWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  glowAura: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#C7BFFF',
    opacity: 0.35,
    top: 10,
  },
  mascotWrapper: {
    marginBottom: 16,
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  progressTrack: {
    width: 200,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 24,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    marginBottom: 10,
  },
});
