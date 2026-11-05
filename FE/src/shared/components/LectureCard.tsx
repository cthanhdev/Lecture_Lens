import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Text, GlassCard, Chip, StatusBadge, StatusType, ProgressBar, IconButton } from '../../shared/ui';
import { Lecture } from '../../core/domain/types';

export interface LectureCardProps {
  lecture: Lecture;
  variant?: 'vertical' | 'horizontal';
  onPress?: () => void;
  onPlayPress?: () => void;
  showWaveform?: boolean;
  style?: StyleProp<ViewStyle>;
}

function mapJobStatus(status: Lecture['status']): StatusType {
  switch (status) {
    case 'READY':
      return 'READY';
    case 'PROCESSING_STT':
    case 'CHUNKING':
    case 'EMBEDDING':
    case 'QUEUED':
      return 'PROCESSING';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'READY';
  }
}

export function LectureCard({
  lecture,
  variant = 'vertical',
  onPress,
  onPlayPress,
  style,
}: LectureCardProps) {
  const durationMin = Math.round(lecture.durationSec / 60);
  const progressRatio =
    lecture.currentPlaybackSec && lecture.durationSec > 0
      ? lecture.currentPlaybackSec / lecture.durationSec
      : 0;

  const handleAction = () => {
    if (onPlayPress) {
      onPlayPress();
    } else if (onPress) {
      onPress();
    }
  };

  if (variant === 'horizontal') {
    return (
      <GlassCard
        variant="frosted"
        padding="base"
        style={[styles.horizontalCard, style]}
        onPress={onPress}
      >
        <View style={styles.headerRow}>
          <Chip
            label={lecture.subjectName}
            subjectKey={lecture.subjectKey}
          />
          <Text variant="caption" color="muted">
            {durationMin} min
          </Text>
        </View>

        <Text variant="title" numberOfLines={2} style={styles.horizontalTitle}>
          {lecture.title}
        </Text>

        <Text variant="caption" color="secondary" numberOfLines={1} style={styles.horizontalChapter}>
          {lecture.chapterTitle}
        </Text>

        {progressRatio > 0 && (
          <ProgressBar progress={progressRatio} style={styles.horizontalProgress} />
        )}

        <View style={styles.horizontalFooter}>
          <Text variant="caption" color="muted">
            {lecture.dateFormatted}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              handleAction();
            }}
            style={styles.playCircle}
          >
            <Feather name="play" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  }

  // Vertical Variant (Standard list item)
  return (
    <GlassCard
      variant="frosted"
      padding="base"
      style={[styles.verticalCard, style]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Chip
          label={lecture.subjectName}
          subjectKey={lecture.subjectKey}
        />
        {lecture.status === 'READY' ? (
          <Text variant="caption" color="muted">
            {lecture.dateFormatted} · {durationMin} min
          </Text>
        ) : (
          <StatusBadge status={mapJobStatus(lecture.status)} />
        )}
      </View>

      <Text variant="title" style={styles.verticalTitle}>
        {lecture.title}
      </Text>

      <Text variant="bodySm" color="secondary" numberOfLines={1} style={styles.verticalChapter}>
        {lecture.chapterTitle}
      </Text>

      {progressRatio > 0 && (
        <ProgressBar progress={progressRatio} style={styles.verticalProgress} />
      )}

      <View style={styles.verticalFooter}>
        <View style={styles.tagsRow}>
          <View style={styles.metaBadge}>
            <Feather name="clock" size={11} color={colors.text.muted} />
            <Text variant="caption" color="muted" style={styles.metaBadgeText}>
              {durationMin} mins
            </Text>
          </View>
          {lecture.fileSizeFormatted && (
            <View style={styles.metaBadge}>
              <Feather name="hard-drive" size={11} color={colors.text.muted} />
              <Text variant="caption" color="muted" style={styles.metaBadgeText}>
                {lecture.fileSizeFormatted}
              </Text>
            </View>
          )}
        </View>

        <IconButton
          icon={<Feather name="play" size={16} color="#FFFFFF" />}
          variant="coral"
          size={36}
          onPress={handleAction}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  horizontalCard: {
    width: 250,
    marginRight: spacing.md,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 22,
  },
  horizontalChapter: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  horizontalProgress: {
    marginVertical: spacing.xs,
  },
  horizontalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  verticalCard: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  verticalTitle: {
    marginTop: 2,
    marginBottom: 4,
  },
  verticalChapter: {
    marginBottom: spacing.sm,
  },
  verticalProgress: {
    marginBottom: spacing.sm,
  },
  verticalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 19, 51, 0.04)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
