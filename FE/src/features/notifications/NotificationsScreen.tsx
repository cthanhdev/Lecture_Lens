import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useNotificationStore } from '../../shared/stores/useNotificationStore';
import { LlIcon } from '../../shared/widgets/icons/LlIcon';

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

const FILTER_TYPES = [
  { key: 'all', label: 'Tất cả (5)' },
  { key: 'lecture', label: 'Bài giảng' },
  { key: 'qa', label: 'Hỏi đáp AI' },
  { key: 'system', label: 'Hệ thống' },
];

export const NotificationsScreen = ({ navigation }: NotificationsScreenProps) => {
  const { colors, borderRadius } = useAppTheme();
  const { notifications, markAsRead, markAllAsRead, unreadCount: getUnread } = useNotificationStore();
  const [activeFilter, setActiveFilter] = useState('all');

  const unreadCount = getUnread();

  const filteredNotifs = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'lecture') return item.type === 'lecture_ready';
    if (activeFilter === 'qa') return item.type === 'study_reminder';
    if (activeFilter === 'system') return item.type === 'system';
    return true;
  });

  const todayNotifs = filteredNotifs.slice(0, 2);
  const earlierNotifs = filteredNotifs.slice(2);

  const handleOpenNotif = (notifId: string, lectureId?: string) => {
    markAsRead(notifId);
    if (lectureId) {
      navigation.navigate('LectureDetail', { lectureId });
    }
  };

  return (
    <DotBackground>
      <LlAppBar
        title="Thông Báo"
        subtitle="Cập nhật học tập từ Cú Mèo"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Sub-header & Action Bar */}
        <View style={styles.subHeaderRow}>
          <View style={styles.titleWithBadge}>
            <Text style={[AppTypography.headlineMd, { color: colors.text }]}>Thông báo</Text>
            {unreadCount > 0 && (
              <View style={[styles.newBadge, { backgroundColor: AppColors.secondaryContainer }]}>
                <Text style={[AppTypography.labelSm, { color: AppColors.onSecondaryContainer, fontWeight: '700' }]}>
                  {unreadCount} mới
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={markAllAsRead}
            style={[styles.markAllBtn, { backgroundColor: AppColors.surfaceContainerHigh, flexDirection: 'row', alignItems: 'center', gap: 4 }]}
          >
            <LlIcon name="check_circle" size={14} color={colors.primary} filled />
            <Text style={[AppTypography.labelMd, { color: colors.primary, fontWeight: '700' }]}>
              Đọc tất cả
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips */}
        <View style={styles.filterGrid}>
          {FILTER_TYPES.map((chip) => {
            const isActive = activeFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(chip.key)}
                style={[
                  styles.filterBtn,
                  isActive
                    ? [styles.filterBtnActive, { backgroundColor: AppColors.primary }]
                    : [styles.filterBtnInactive, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    AppTypography.labelMd,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* GROUP: HÔM NAY */}
        {todayNotifs.length > 0 && (
          <View style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                Hôm nay
              </Text>
              <View style={[styles.groupDot, { backgroundColor: AppColors.primaryContainer }]} />
            </View>

            {todayNotifs.map((item) => {
              const isLecture = item.type === 'lecture_ready';
              const iconBg = isLecture ? AppColors.tertiaryFixed : AppColors.surfaceContainerHigh;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: colors.card,
                      borderRadius: borderRadius.card,
                      borderColor: item.isRead ? colors.border : AppColors.secondaryFixed,
                    },
                    AppShadows.card,
                  ]}
                >
                  {/* Delicate Washi Tape */}
                  <View style={styles.cardTape}>
                    <WashiTapeAccent color={isLecture ? 'mint' : 'sakura'} width={50} height={10} rotation="-1deg" />
                  </View>

                  <View style={styles.notifBodyRow}>
                    {/* Mint / Lilac Icon Avatar */}
                    <View style={[styles.notifIconCircle, { backgroundColor: iconBg }]}>
                      <LlIcon
                        name={isLecture ? 'headphones' : 'auto_awesome'}
                        size={22}
                        color={isLecture ? AppColors.onTertiaryFixed : AppColors.primary}
                      />
                    </View>

                    <View style={styles.notifTextCol}>
                      <View style={styles.notifTitleRow}>
                        <Text style={[AppTypography.headlineSm, styles.notifTitle, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: AppColors.primary }]} />}
                      </View>

                      <Text style={[AppTypography.bodyMedium, styles.notifDesc, { color: colors.textSecondary }]}>
                        {item.message}
                      </Text>

                      <View style={styles.notifActionRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LlIcon name="clock" size={12} color={colors.textSecondary} />
                          <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                            {item.timeAgo}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleOpenNotif(item.id, item.lectureId)}
                          style={[styles.viewLectureBtn, { backgroundColor: AppColors.primaryContainer, flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                        >
                          <Text style={[AppTypography.labelSm, { color: '#FFFFFF', fontWeight: '700' }]}>
                            Xem bài giảng
                          </Text>
                          <LlIcon name="arrow_forward" size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* GROUP: TRƯỚC ĐÓ */}
        {earlierNotifs.length > 0 && (
          <View style={styles.groupSection}>
            <View style={styles.groupHeaderRow}>
              <Text style={[AppTypography.headlineSm, { color: colors.text, fontWeight: '700' }]}>
                Trước đó
              </Text>
              <View style={[styles.groupDot, { backgroundColor: colors.border }]} />
            </View>

            {earlierNotifs.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: colors.card,
                    borderRadius: borderRadius.card,
                    borderColor: colors.border,
                  },
                  AppShadows.card,
                ]}
              >
                <View style={styles.notifBodyRow}>
                  <View style={[styles.notifIconCircle, { backgroundColor: AppColors.surfaceContainer }]}>
                    <LlIcon name="info" size={20} color={colors.primary} />
                  </View>

                  <View style={styles.notifTextCol}>
                    <Text style={[AppTypography.headlineSm, styles.notifTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[AppTypography.bodyMedium, styles.notifDesc, { color: colors.textSecondary }]}>
                      {item.message}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <LlIcon name="clock" size={12} color={colors.textSecondary} />
                      <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                        {item.timeAgo}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    shadowColor: '#5445B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBtnInactive: {
    borderWidth: 1,
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notifCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -5,
    alignSelf: 'center',
  },
  notifBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  notifIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    flex: 1,
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  notifDesc: {
    lineHeight: 20,
    marginBottom: 8,
  },
  notifActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewLectureBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
