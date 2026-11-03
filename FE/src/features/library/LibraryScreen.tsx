import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { LlIcon } from '../../shared/widgets/icons/LlIcon';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { LectureCard, ProcessingCard } from '../../shared/widgets/cards/LectureCards';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { LectureListSkeleton } from '../../shared/widgets/skeleton/SkeletonShimmer';
import { useLectureStore } from '../../shared/stores/useLectureStore';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useNotificationStore } from '../../shared/stores/useNotificationStore';

type LibraryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Library'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface LibraryScreenProps {
  navigation: LibraryScreenNavigationProp;
}

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'ready', label: 'Sẵn sàng' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'Công nghệ phần mềm', label: 'Công nghệ' },
  { key: 'Giải Tích', label: 'Giải Tích' },
  { key: 'Khoa Học Máy Tính', label: 'Khoa học máy tính' },
];

export const LibraryScreen = ({ navigation }: LibraryScreenProps) => {
  const { colors, borderRadius } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const { activeFilter, setFilter, toggleBookmark, getFilteredLectures } = useLectureStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount());

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'normal' | 'empty' | 'skeleton'>('normal');

  const allFiltered = getFilteredLectures();
  const filteredLectures = searchQuery.trim()
    ? allFiltered.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allFiltered;

  const handleCardPress = (lectureId: string, status: string) => {
    if (status === 'processing') {
      navigation.navigate('Processing', { lectureId });
    } else {
      navigation.navigate('LectureDetail', { lectureId });
    }
  };

  return (
    <DotBackground>
      <View style={styles.container}>
        {/* Top App Bar */}
        <LlAppBar
          title="LectureLens"
          subtitle="Thư Viện Bài Giảng"
          showNotifications={true}
          notificationCount={unreadCount}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting & Avatar Section */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextCol}>
              <View style={styles.nameRow}>
                <Text style={[AppTypography.headlineMd, { color: colors.text }]}>
                  Xin chào, {user.name.split(' ').pop()}
                </Text>
                <LlIcon name="auto_awesome" size={18} color="#E5A800" filled style={{ marginLeft: 6 }} />
              </View>
              <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary }]}>
                Bàn học hôm nay đã sẵn sàng rồi nè!
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Settings')}
              style={styles.avatarWrapper}
            >
              <View style={[styles.avatarCircle, { backgroundColor: AppColors.primaryContainer }]}>
                <CuMeoWidget variant="happy" size={32} isAnimated={false} />
              </View>
              <View style={styles.onlinePip} />
            </TouchableOpacity>
          </View>

          {/* Search Input Bar (Tactile Stationery Styling) */}
          <View style={styles.searchBarWrapper}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                AppShadows.card,
              ]}
            >
              <LlIcon name="search" size={20} color={colors.primary} />
              <TextInput
                style={[AppTypography.bodyMedium, styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm bài giảng, môn học, từ khóa..."
                placeholderTextColor="#7D7893"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <LlIcon name="close" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <View style={[styles.inputDivider, { backgroundColor: AppColors.surfaceContainer }]} />
              <TouchableOpacity
                onPress={() => navigation.navigate('Upload')}
                style={[styles.micBtn, { backgroundColor: AppColors.surfaceContainer }]}
              >
                <LlIcon name="mic" size={18} color={AppColors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Horizontal Filter Bar */}
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTER_TABS.map((tab) => {
                const isSelected = activeFilter === tab.key;
                const isProcessingTab = tab.key === 'processing';
                const isReadyTab = tab.key === 'ready';

                return (
                  <TouchableOpacity
                    key={tab.key}
                    activeOpacity={0.8}
                    onPress={() => {
                      setFilter(tab.key);
                      if (viewMode === 'empty') setViewMode('normal');
                    }}
                    style={[
                      styles.filterChip,
                      isSelected
                        ? [styles.filterChipActive, { backgroundColor: AppColors.primaryContainer }]
                        : [styles.filterChipInactive, { backgroundColor: colors.card, borderColor: colors.border }],
                    ]}
                  >
                    {isReadyTab && <View style={styles.readyDot} />}
                    {isProcessingTab && <View style={styles.amberPingDot} />}
                    <Text
                      style={[
                        AppTypography.labelMd,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {tab.label}
                      {tab.key === 'all' ? ` (${allFiltered.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section Header & View Mode Switcher */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[AppTypography.headlineSm, { color: colors.text }]}>
              Bài giảng gần đây
            </Text>

            {/* Quick Demo Switcher (List / Empty / Skeleton) */}
            <View style={[styles.viewModePill, { backgroundColor: AppColors.surfaceContainerHigh }]}>
              <TouchableOpacity
                onPress={() => setViewMode('normal')}
                style={[styles.viewModeBtn, viewMode === 'normal' && styles.viewModeBtnActive]}
              >
                <LlIcon name="style" size={13} color={viewMode === 'normal' ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('empty')}
                style={[styles.viewModeBtn, viewMode === 'empty' && styles.viewModeBtnActive]}
              >
                <LlIcon name="bedtime" size={13} color={viewMode === 'empty' ? colors.primary : colors.textSecondary} filled />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('skeleton')}
                style={[styles.viewModeBtn, viewMode === 'skeleton' && styles.viewModeBtnActive]}
              >
                <LlIcon name="sync" size={13} color={viewMode === 'skeleton' ? colors.primary : colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* SKELETON STATE VIEW */}
          {viewMode === 'skeleton' ? (
            <LectureListSkeleton />
          ) : viewMode === 'empty' || filteredLectures.length === 0 ? (
            /* EMPTY STATE VIEW (Sleeping Owl Desk) */
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.modal,
                  borderColor: colors.border,
                },
                AppShadows.card,
              ]}
            >
              <CuMeoWidget variant="sleeping" size={140} />
              <Text style={[AppTypography.headlineSm, styles.emptyTitle, { color: colors.text }]}>
                Bàn học chưa có bài giảng nào
              </Text>
              <Text style={[AppTypography.bodyMedium, styles.emptySub, { color: colors.textSecondary }]}>
                Cú Mèo đang ngủ trưa đợi bạn! Hãy tải lên bản ghi âm bài học đầu tiên để bắt đầu học tập nhẹ nhàng nhé.
              </Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => navigation.navigate('Upload')}
                style={[styles.emptyUploadBtn, { backgroundColor: AppColors.primaryContainer }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <LlIcon name="add" size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
                    Tải bản ghi đầu tiên
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* NORMAL LECTURE LIST */
            <View style={styles.lectureList}>
              {filteredLectures.map((item) =>
                item.status === 'processing' ? (
                  <ProcessingCard
                    key={item.id}
                    lecture={item}
                    onPress={() => handleCardPress(item.id, item.status)}
                  />
                ) : (
                  <LectureCard
                    key={item.id}
                    lecture={item}
                    onPress={() => handleCardPress(item.id, item.status)}
                    onBookmarkPress={() => toggleBookmark(item.id)}
                    onResumePlay={() => {
                      navigation.navigate('LectureDetail', { lectureId: item.id });
                    }}
                  />
                )
              )}
            </View>
          )}

          {/* Safe spacer for floating FAB and Bottom Nav */}
          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Floating Action Button (FAB) Above Bottom Bar */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Upload')}
          style={[styles.fabButton, AppShadows.buttonPrimary]}
        >
          <LlIcon name="cloud_upload" size={20} color="#FFFFFF" />
          <Text style={[AppTypography.labelLarge, styles.fabText]}>
            Tải bản ghi lên
          </Text>
        </TouchableOpacity>
      </View>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  greetingTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginLeft: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePip: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1F6B58',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchBarWrapper: {
    marginVertical: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 9999,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
  },
  clearBtn: {
    padding: 6,
  },
  inputDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 8,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSection: {
    marginVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  filterChipActive: {
    shadowColor: '#5445B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipInactive: {
    borderWidth: 1,
  },
  readyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#1F6B58',
    marginRight: 6,
  },
  amberPingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E5A800',
    marginRight: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  viewModePill: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 2,
  },
  viewModeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B3550',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lectureList: {
    gap: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
  },
  emptyTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptySub: {
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 22,
  },
  emptyUploadBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  fabButton: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 9999,
    zIndex: 90,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
});
