import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useLectureStore } from '../../shared/stores/useLectureStore';
import { LlIcon } from '../../shared/widgets/icons/LlIcon';

type ProcessingScreenProps = {
  route: RouteProp<RootStackParamList, 'Processing'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Processing'>;
};

const PIPELINE_STEPS = [
  {
    title: 'Tải lên máy chủ bảo mật',
    desc: 'Đã hoàn tất lưu trữ bản ghi mã hóa an toàn',
    threshold: 0.25,
  },
  {
    title: 'Bóc băng giọng nói với Whisper AI',
    desc: 'Nhận diện xong 4,520 từ chuẩn mốc thời gian',
    threshold: 0.65,
  },
  {
    title: 'Tách chủ đề & lập mục lục thông minh',
    desc: 'Trích xuất 4 phân đoạn thảo luận trọng tâm',
    threshold: 0.85,
  },
  {
    title: 'Chuẩn bị trợ lý Cú Mèo & thẻ ôn thi',
    desc: 'Sẵn sàng hỏi đáp ngữ cảnh bài học',
    threshold: 1.0,
  },
];

export const ProcessingScreen = ({ route, navigation }: ProcessingScreenProps) => {
  const { lectureId } = route.params;
  const { colors, borderRadius } = useAppTheme();
  const lectures = useLectureStore((state) => state.lectures);
  const updateProgress = useLectureStore((state) => state.updateProgress);

  const lecture = lectures.find((l) => l.id === lectureId) || lectures[0];
  const [progress, setProgress] = useState(0.65);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(interval);
          updateProgress(lecture.id, 1, 'ready');
          return 1;
        }
        const next = Math.min(prev + 0.05, 1);
        updateProgress(lecture.id, next, next >= 1 ? 'ready' : 'processing');
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [lecture?.id, updateProgress]);

  const progressPercent = Math.round(progress * 100);
  const isDone = progress >= 1;

  return (
    <DotBackground>
      <LlAppBar
        title="Tải Lên & Ghi Âm"
        subtitle={lecture?.title || 'Đang bóc băng bài học'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: MASCOT STAGE CARD */}
        <View
          style={[
            styles.mascotStageCard,
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
            <WashiTapeAccent color="mint" width={56} height={12} rotation="-1deg" />
          </View>

          {/* Cú Mèo listening with headphones */}
          <View style={styles.mascotWrapper}>
            <CuMeoWidget variant={isDone ? 'happy' : 'listening'} size={145} />
          </View>

          <Text style={[AppTypography.headlineMd, styles.stageTitle, { color: colors.text }]}>
            {isDone ? 'Đã hoàn tất bóc băng!' : 'Đang xử lý bài giảng'}
          </Text>

          <Text style={[AppTypography.bodyMedium, styles.stageSub, { color: colors.textSecondary }]}>
            {isDone
              ? 'Cú Mèo đã sẵn sàng sổ tay ghi chú và trích dẫn bài học cho bạn!'
              : 'Cú Mèo đang lắng nghe và trích xuất từng ghi chú tỉ mỉ cho bạn nè!'}
          </Text>

          {/* Progress Status Block */}
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                {isDone ? (
                  <LlIcon name="check_circle" size={16} color={AppColors.tertiary} filled />
                ) : (
                  <LlIcon name="sync" size={16} color={colors.primary} />
                )}
                <Text style={[AppTypography.labelMd, { color: colors.primary, fontWeight: '700' }]}>
                  {isDone ? 'Bóc băng hoàn tất 100%' : 'Xử lý mô hình Whisper AI'}
                </Text>
              </View>
              <Text style={[AppTypography.headlineSm, { color: colors.primary, fontWeight: '700' }]}>
                {progressPercent}%
              </Text>
            </View>

            {/* Progress Bar Track */}
            <View style={[styles.progressTrack, { backgroundColor: AppColors.surfaceContainer }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isDone ? AppColors.tertiary : AppColors.primaryContainer,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* CARD 2: LECTURE INFO CARD */}
        <View
          style={[
            styles.lectureInfoCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: AppColors.primaryFixed }]}>
            <LlIcon name="mic" size={24} color={colors.primary} />
          </View>

          <View style={styles.lectureTextCol}>
            <View style={styles.subjectTagRow}>
              <View style={[styles.miniMintBadge, { backgroundColor: AppColors.tertiaryFixed }]}>
                <Text style={[AppTypography.labelSm, { color: AppColors.onTertiaryFixed, fontWeight: '700' }]}>
                  {lecture?.subject || 'Công nghệ phần mềm'}
                </Text>
              </View>
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                {lecture?.audioFileSize || '42.5 MB'} • 45 phút
              </Text>
            </View>

            <Text style={[AppTypography.headlineSm, styles.lectureTitle, { color: colors.text }]} numberOfLines={2}>
              {lecture?.title || 'Lập trình Web - Bài 5: REST API'}
            </Text>
          </View>
        </View>

        {/* CARD 3: VERTICAL STEPPER (PROCESSING PIPELINE) */}
        <View
          style={[
            styles.stepperCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          <View style={styles.stepperHeader}>
            <LlIcon name="auto_awesome" size={20} color={colors.primary} filled style={{ marginRight: 6 }} />
            <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
              Tiến trình xử lý chi tiết
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {PIPELINE_STEPS.map((step, idx) => {
              const isStepDone = progress >= step.threshold;
              const isStepCurrent = !isStepDone && (idx === 0 || progress >= PIPELINE_STEPS[idx - 1].threshold);
              const isLast = idx === PIPELINE_STEPS.length - 1;

              return (
                <View key={idx} style={styles.stepRow}>
                  {/* Left Column: Icon node + connecting line */}
                  <View style={styles.nodeCol}>
                    <View
                      style={[
                        styles.stepNode,
                        isStepDone
                          ? [styles.nodeDone, { backgroundColor: AppColors.tertiaryFixed }]
                          : isStepCurrent
                          ? [styles.nodeCurrent, { backgroundColor: AppColors.primaryContainer }]
                          : [styles.nodeWaiting, { backgroundColor: AppColors.surfaceContainer }],
                      ]}
                    >
                      {isStepDone ? (
                        <LlIcon name="check_circle" size={14} color={AppColors.onTertiaryFixed} filled />
                      ) : isStepCurrent ? (
                        <LlIcon name="sync" size={14} color="#FFFFFF" />
                      ) : (
                        <LlIcon name="sync" size={14} color={colors.textSecondary} />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.connectLine,
                          {
                            backgroundColor: isStepDone
                              ? AppColors.tertiaryFixed
                              : AppColors.surfaceContainer,
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Column: Title & Desc */}
                  <View style={styles.stepTextCol}>
                    <Text
                      style={[
                        AppTypography.labelMd,
                        {
                          color: isStepDone ? colors.text : isStepCurrent ? colors.primary : colors.textSecondary,
                          fontWeight: isStepDone || isStepCurrent ? '700' : '500',
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                    <Text style={[AppTypography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* CTA: Open Lecture */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('LectureDetail', { lectureId: lecture.id })}
          style={[
            styles.openLectureBtn,
            { backgroundColor: isDone ? AppColors.primaryContainer : AppColors.primary },
            AppShadows.buttonPrimary,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
              {isDone ? 'Mở bài giảng ngay' : 'Xem trước bản ghi'}
            </Text>
            {isDone ? (
              <LlIcon name="auto_awesome" size={18} color="#FFFFFF" filled />
            ) : (
              <LlIcon name="arrow_forward" size={18} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  mascotStageCard: {
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
  },
  mascotWrapper: {
    marginVertical: 10,
  },
  stageTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  stageSub: {
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 290,
    lineHeight: 22,
  },
  progressBlock: {
    width: '100%',
    marginTop: 6,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  lectureInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lectureTextCol: {
    flex: 1,
  },
  subjectTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  miniMintBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  lectureTitle: {
    lineHeight: 22,
  },
  stepperCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  nodeCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeDone: {},
  nodeCurrent: {},
  nodeWaiting: {},
  connectLine: {
    width: 2,
    height: 32,
    marginTop: 2,
  },
  stepTextCol: {
    flex: 1,
    paddingTop: 4,
  },
  openLectureBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
