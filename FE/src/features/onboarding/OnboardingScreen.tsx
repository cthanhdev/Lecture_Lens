import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { CuMeoWidget, CuMeoVariant } from '../../shared/widgets/mascot/CuMeoWidget';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useAppStore } from '../../shared/stores/useAppStore';
import { LlIcon, LlIconName } from '../../shared/widgets/icons/LlIcon';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

interface SlideData {
  iconName: LlIconName;
  tag: string;
  title: string;
  description: string;
  variant: CuMeoVariant;
}

const SLIDES: SlideData[] = [
  {
    iconName: 'mic',
    tag: 'Tự động hóa giảng đường',
    title: 'Tải bản ghi bài giảng',
    description: 'Biến âm thanh giảng đường thành sổ tay bài học chi tiết chỉ sau vài phút.',
    variant: 'listening',
  },
  {
    iconName: 'search',
    tag: 'Truy vết thông minh',
    title: 'Tìm lại khái niệm trong vài giây',
    description: 'Gõ từ khóa bất kỳ để nghe lại đúng đoạn giảng viên đang giải thích.',
    variant: 'happy',
  },
  {
    iconName: 'auto_awesome',
    tag: 'Đồng hành ôn tập',
    title: 'Trợ lý Cú Mèo hỏi đáp chuẩn xác',
    description: 'Hỏi đáp mọi thắc mắc học tập, Cú Mèo dẫn chứng mốc thời gian tức thì.',
    variant: 'star_eyes',
  },
];

export const OnboardingScreen = ({ navigation }: OnboardingScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors, borderRadius } = useAppTheme();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  const handleFinish = () => {
    completeOnboarding();
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <DotBackground>
      <View style={styles.container}>
        {/* Floating Ambient Sakura Dots */}
        <View style={[styles.ambientPetal, styles.petal1]} pointerEvents="none" />
        <View style={[styles.ambientPetal, styles.petal2]} pointerEvents="none" />
        <View style={[styles.ambientPetal, styles.petal3]} pointerEvents="none" />

        {/* Top Header: Brand chip & Skip button */}
        <View style={styles.topBar}>
          <View style={[styles.brandChip, { backgroundColor: AppColors.surfaceContainerHigh }]}>
            <View style={styles.pingDot} />
            <Text style={[AppTypography.labelSm, { color: AppColors.primary, letterSpacing: 1.2 }]}>
              LECTURELENS
            </Text>
          </View>

          {!isLast ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFinish}
              style={[styles.skipButton, { backgroundColor: AppColors.surfaceContainerHigh }]}
            >
              <Text style={[AppTypography.labelMd, { color: AppColors.primary }]}>Bỏ qua</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Card Viewport: Stationery Desk Card */}
        <View style={styles.cardContainer}>
          <View
            style={[
              styles.notebookCard,
              {
                backgroundColor: colors.card,
                borderRadius: borderRadius.modal,
                borderColor: colors.border,
              },
              AppShadows.card,
            ]}
          >
            {/* Top Washi Tape */}
            <View style={styles.cardTape}>
              <WashiTapeAccent color="sakura" width={54} height={12} rotation="-1deg" />
            </View>

            {/* Mascot Stage */}
            <View style={styles.mascotBox}>
              <CuMeoWidget variant={currentSlide.variant} size={150} />
            </View>

            {/* Slide Text Content */}
            <View style={styles.contentBox}>
              <View style={[styles.tagBadge, { backgroundColor: AppColors.surfaceContainer, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <LlIcon name={currentSlide.iconName} size={14} color={colors.primary} />
                <Text style={[AppTypography.labelSm, { color: colors.primary }]}>
                  {currentSlide.tag}
                </Text>
              </View>

              <Text style={[AppTypography.headlineMd, styles.title, { color: colors.text }]}>
                {currentSlide.title}
              </Text>

              <Text
                style={[
                  AppTypography.bodyMedium,
                  styles.description,
                  { color: colors.textSecondary },
                ]}
              >
                {currentSlide.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Controls: Dots & Next/Finish CTA */}
        <View style={styles.bottomControls}>
          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, idx) => {
              const active = idx === currentIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    active
                      ? [styles.activeDot, { backgroundColor: AppColors.primaryContainer }]
                      : { backgroundColor: AppColors.surfaceContainerHighest },
                  ]}
                />
              );
            })}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            style={[
              styles.ctaButton,
              { backgroundColor: AppColors.primaryContainer },
              AppShadows.buttonPrimary,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
                {isLast ? 'Bắt đầu học ngay' : 'Tiếp tục'}
              </Text>
              {isLast ? (
                <LlIcon name="auto_awesome" size={18} color="#FFFFFF" filled />
              ) : (
                <LlIcon name="arrow_forward" size={18} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: AppColors.primaryContainer,
    marginRight: 6,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ambientPetal: {
    position: 'absolute',
    borderRadius: 999,
  },
  petal1: {
    top: 70,
    right: 20,
    width: 14,
    height: 8,
    backgroundColor: '#FECDDD',
    opacity: 0.6,
    transform: [{ rotate: '25deg' }],
  },
  petal2: {
    top: '40%',
    left: 12,
    width: 16,
    height: 9,
    backgroundColor: '#CAE9DF',
    opacity: 0.5,
    transform: [{ rotate: '-15deg' }],
  },
  petal3: {
    bottom: 120,
    right: 18,
    width: 12,
    height: 7,
    backgroundColor: '#FECDDD',
    opacity: 0.5,
    transform: [{ rotate: '40deg' }],
  },
  cardContainer: {
    marginVertical: 'auto',
    width: '100%',
  },
  notebookCard: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardTape: {
    marginBottom: 8,
  },
  mascotBox: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contentBox: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
