import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../core/theme/ThemeContext';
import { AppColors } from '../../../core/theme/colors';
import { AppTypography } from '../../../core/theme/typography';
import { AppShadows } from '../../../core/theme/layout';
import { LlIcon } from '../icons/LlIcon';
import { LectureUiModel } from '../../models/lecture.types';
import { formatDuration } from '../../../core/utils/formatters';
import { LlPressable } from '../interactive/LlPressable';
import { WashiTapeAccent } from '../washi_tape/WashiTapeAccent';

interface LectureCardProps {
  lecture: LectureUiModel;
  onPress: () => void;
  onBookmarkPress?: () => void;
  onResumePlay?: () => void;
}

export const LectureCard = ({
  lecture,
  onPress,
  onBookmarkPress,
  onResumePlay,
}: LectureCardProps) => {
  const { colors, borderRadius } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.card,
          borderColor: colors.border,
        },
        AppShadows.card,
      ]}
    >
      {/* Washi Tape Accent on Top */}
      <View style={styles.tapeAnchor} pointerEvents="none">
        <WashiTapeAccent color="sakura" width={56} height={12} rotation="-1deg" />
      </View>

      {/* Card Top Badge Row */}
      <View style={styles.topBadgeRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={styles.badgeGroup}
        >
          <View style={[styles.readyPill, { backgroundColor: AppColors.tertiaryFixed, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <LlIcon name="check_circle" size={12} color={AppColors.tertiary} filled />
            <Text style={[AppTypography.labelSm, { color: AppColors.tertiary, fontWeight: '700' }]}>
              Sẵn sàng
            </Text>
          </View>

          <View style={[styles.subjectTag, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text
              style={[AppTypography.labelSm, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {lecture.subject}
              {lecture.university ? ` • ${lecture.university}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBookmarkPress}
          style={styles.bookmarkButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={lecture.isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu bài giảng'}
        >
          <LlIcon
            name="bookmark"
            size={18}
            color={lecture.isBookmarked ? colors.primary : colors.textSecondary}
            filled={lecture.isBookmarked}
          />
        </TouchableOpacity>
      </View>

      {/* Card Body Clickable Area */}
      <LlPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={lecture.title}
        scaleFactor={0.99}
      >
        {/* Lecture Title */}
        <Text style={[AppTypography.headlineSm, styles.title, { color: colors.text }]} numberOfLines={2}>
          {lecture.title}
        </Text>

        {/* Sticky Note Mini Citation Snippet */}
        {lecture.stickySnippet && (
          <View style={[styles.stickySnippetBox, { backgroundColor: colors.stickyYellowBg }]}>
            <View style={styles.stickySnippetHeader}>
              <LlIcon name="push_pin" size={14} color={colors.stickyYellowAccent} style={{ marginRight: 4 }} />
              <Text style={[AppTypography.labelSm, styles.stickySnippetLabel, { color: colors.stickyYellowAccent }]}>
                Điểm nhấn cốt lõi của bài
              </Text>
            </View>
            <Text style={[AppTypography.bodyMedium, styles.stickySnippetText, { color: colors.stickyYellowText }]} numberOfLines={2}>
              “{lecture.stickySnippet}”
            </Text>
          </View>
        )}

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <LlIcon name="clock" size={13} color={colors.textSecondary} />
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
              {formatDuration(lecture.durationSeconds || 0)}
            </Text>
          </View>
          <Text style={[styles.metricDot, { color: colors.border }]}>•</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <LlIcon name="toc" size={13} color={colors.textSecondary} />
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
              {lecture.topicsCount || (lecture.topics ? lecture.topics.length : 4)} chủ đề
            </Text>
          </View>
          <Text style={[styles.metricDot, { color: colors.border }]}>•</Text>
          <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
            {lecture.relativeTime}
          </Text>
        </View>
      </LlPressable>

      {/* Card Action Footer */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onResumePlay || onPress}
          style={[styles.resumeButton, { backgroundColor: colors.surfaceContainer }]}
          accessibilityRole="button"
          accessibilityLabel={`Nghe tiếp từ ${formatDuration(lecture.resumePositionSeconds || 755)}`}
        >
          <View style={[styles.miniPlayIcon, { backgroundColor: colors.primaryContainer }]}>
            <LlIcon name="play_arrow" size={10} color="#FFFFFF" filled />
          </View>
          <Text style={[AppTypography.labelMd, { color: colors.primary, fontWeight: '700' }]}>
            Nghe tiếp từ {formatDuration(lecture.resumePositionSeconds || 755)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={[styles.noteButton, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết ghi chú"
        >
          <LlIcon name="description" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ProcessingCard = ({
  lecture,
  onPress,
}: {
  lecture: LectureUiModel;
  onPress: () => void;
}) => {
  const { colors, borderRadius } = useAppTheme();
  const progressPercent = Math.round((lecture.processingProgress || 0.68) * 100);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.card,
          borderColor: colors.border,
        },
        AppShadows.card,
      ]}
    >
      {/* Washi Tape Accent (Mint) */}
      <View style={styles.tapeAnchor} pointerEvents="none">
        <WashiTapeAccent color="mint" width={56} height={12} rotation="1.5deg" />
      </View>

      {/* Top Badge Row */}
      <View style={styles.topBadgeRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={styles.badgeGroup}
        >
          <View style={[styles.processingPill, { backgroundColor: AppColors.warningContainer }]}>
            <View style={styles.pingAmberDot} />
            <Text style={[AppTypography.labelSm, { color: AppColors.warningDark, fontWeight: '700' }]}>
              Đang xử lý ({progressPercent}%)
            </Text>
          </View>

          <View style={[styles.subjectTag, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>
              {lecture.subject}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.spinIconBox, { backgroundColor: colors.surfaceContainer }]}>
          <LlIcon name="sync" size={16} color={AppColors.warningDark} />
        </View>
      </View>

      {/* Main Body Clickable Area */}
      <LlPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={lecture.title}
        scaleFactor={0.99}
      >
        {/* Title */}
        <Text style={[AppTypography.headlineSm, styles.title, { color: colors.text }]} numberOfLines={2}>
          {lecture.title}
        </Text>

        {/* Real-time Processing Visual Box */}
        <View style={[styles.processingBox, { backgroundColor: colors.surfaceContainerLow }]}>
          <View style={styles.procStatusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LlIcon name="auto_awesome" size={14} color={colors.primary} filled />
              <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                Cú Mèo đang lắng nghe & tổng hợp...
              </Text>
            </View>
            <Text style={[AppTypography.labelSm, { color: colors.textSecondary, fontWeight: '700' }]}>
              {progressPercent}%
            </Text>
          </View>

          {/* Gradient-like Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainer }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primaryContainer },
              ]}
            />
          </View>

          <View style={styles.procFooterRow}>
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary, fontStyle: 'italic' }]}>
              {lecture.processingStatusText || 'Đang tách chủ đề & lập mục lục thông minh...'}
            </Text>
            <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>
              {lecture.remainingTimeText || '~ 45 giây nữa'}
            </Text>
          </View>
        </View>
      </LlPressable>

      {/* Audio Spec & File Metadata */}
      <View style={styles.fileMetaRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}
        >
          <LlIcon name="mic" size={14} color={colors.textSecondary} />
          <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]} numberOfLines={1}>
            {lecture.audioFileName || 'Bản ghi phòng học'} ({lecture.audioFileSize || '42.5 MB'})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPress}
          style={[styles.detailChip, { backgroundColor: colors.surfaceContainer }]}
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết tiến trình bài giảng"
        >
          <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
            Xem chi tiết
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    position: 'relative',
  },
  tapeAnchor: {
    position: 'absolute',
    top: -6,
    right: 24,
    zIndex: 2,
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  readyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  processingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pingAmberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5A800',
    marginRight: 6,
  },
  subjectTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 180,
  },
  bookmarkButton: {
    padding: 6,
  },
  spinIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 10,
    lineHeight: 24,
  },
  stickySnippetBox: {
    backgroundColor: '#FFF6D9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  stickySnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pinIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  stickySnippetLabel: {
    color: '#A67814',
    fontWeight: '700',
  },
  stickySnippetText: {
    color: '#5C4813',
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  metricDot: {
    fontSize: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resumeButton: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  miniPlayIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  noteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingBox: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
  },
  procStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  procFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  detailChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
