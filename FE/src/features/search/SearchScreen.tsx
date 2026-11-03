import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
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
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { useLectureStore, selectLectures } from '../../shared/stores/useLectureStore';
import { useAudioPlayerStore } from '../../shared/stores/useAudioPlayerStore';

type SearchScreenNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface SearchScreenProps {
  navigation: SearchScreenNavProp;
}

const RECENT_CHIPS = [
  { label: 'REST API', color: 'pink' },
  { label: 'Pipeline MIPS', color: 'lavender' },
  { label: 'Kiểm định Z-Score', color: 'mint' },
  { label: 'JWT Token', color: 'yellow' },
];

export const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const { colors, borderRadius } = useAppTheme();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(RECENT_CHIPS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lectures = useLectureStore(selectLectures);
  const seekTo = useAudioPlayerStore((state) => state.seekTo);
  const play = useAudioPlayerStore((state) => state.play);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }, []);

  const matchingLectures = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) return [];
    return lectures.filter((lec) => {
      const inTitle = lec.title.toLowerCase().includes(trimmed);
      const inSubject = lec.subject.toLowerCase().includes(trimmed);
      const inTranscripts = lec.transcripts?.some(
        (t) =>
          t.content.toLowerCase().includes(trimmed) ||
          (t.speaker && t.speaker.toLowerCase().includes(trimmed))
      );
      const inTopics = lec.topics?.some((t) => t.title.toLowerCase().includes(trimmed));
      const inTags = lec.tags?.some((t) => t.toLowerCase().includes(trimmed));
      return inTitle || inSubject || inTranscripts || inTopics || inTags;
    });
  }, [lectures, query]);

  const totalMatchingTimestamps = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return 0;
    return matchingLectures.reduce((count, lec) => {
      const transcriptMatches = (lec.transcripts || []).filter(
        (t) =>
          t.content.toLowerCase().includes(trimmed) ||
          (t.speaker && t.speaker.toLowerCase().includes(trimmed))
      ).length;
      const topicMatches = (lec.topics || []).filter((t) =>
        t.title.toLowerCase().includes(trimmed)
      ).length;
      const directMatches = transcriptMatches + topicMatches;
      return count + (directMatches > 0 ? directMatches : 1);
    }, 0);
  }, [matchingLectures, query]);

  const handleJumpToLecture = (lectureId: string, seconds: number) => {
    seekTo(seconds);
    play();
    navigation.navigate('LectureDetail', { lectureId });
  };

  return (
    <DotBackground>
      <LlAppBar
        title="Tìm Kiếm"
        subtitle="Khái niệm, từ khóa & mốc thời gian"
        showNotifications={true}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <FlatList
        data={matchingLectures}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        renderItem={({ item: lec }) => (
          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: colors.card,
                borderRadius: borderRadius.modal,
                borderColor: colors.border,
              },
              AppShadows.card,
            ]}
          >
            {/* Washi tape topper */}
            <View style={styles.cardTape}>
              <WashiTapeAccent color="sakura" width={58} height={12} rotation="-1deg" />
            </View>

            {/* Lecture Info Header */}
            <View style={styles.resultCardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.tagRow}>
                  <View style={[styles.miniSubTag, { backgroundColor: AppColors.surfaceContainerHigh }]}>
                    <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                      {lec.subject}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <LlIcon name="clock" size={12} color={colors.textSecondary} />
                    <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                      {lec.relativeTime}
                    </Text>
                  </View>
                </View>

                <Text style={[AppTypography.headlineSm, styles.resultTitle, { color: colors.text }]}>
                  {lec.title}
                </Text>
              </View>

              <View style={[styles.micIconCircle, { backgroundColor: AppColors.surfaceContainerLow }]}>
                <LlIcon name="mic" size={18} color={colors.primary} />
              </View>
            </View>

            {/* Matching Snippets List */}
            <View style={styles.snippetsList}>
              {(() => {
                const trimmed = query.trim().toLowerCase();
                const matchedTranscripts = (lec.transcripts || []).filter(
                  (t) =>
                    t.content.toLowerCase().includes(trimmed) ||
                    (t.speaker && t.speaker.toLowerCase().includes(trimmed))
                );

                if (matchedTranscripts.length > 0) {
                  return matchedTranscripts.slice(0, 2).map((seg, sIdx) => (
                    <TouchableOpacity
                      key={`trans_${sIdx}`}
                      activeOpacity={0.88}
                      onPress={() => handleJumpToLecture(lec.id, seg.startSeconds)}
                      style={[
                        styles.snippetBox,
                        { backgroundColor: AppColors.surfaceContainerLow },
                      ]}
                    >
                      <View style={styles.snippetTopRow}>
                        <View
                          style={[
                            styles.mintTimeChip,
                            {
                              backgroundColor: AppColors.tertiaryFixed,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            },
                          ]}
                        >
                          <LlIcon
                            name="play_arrow"
                            size={10}
                            color={AppColors.onTertiaryFixed}
                            filled
                          />
                          <Text
                            style={[
                              AppTypography.labelSm,
                              {
                                color: AppColors.onTertiaryFixed,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {seg.timestamp}
                          </Text>
                        </View>
                        <Text
                          style={[
                            AppTypography.labelSm,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {seg.speaker ? `${seg.speaker}` : 'Bản ghi âm'}
                        </Text>
                      </View>

                      <Text
                        style={[
                          AppTypography.bodyMedium,
                          styles.snippetText,
                          { color: colors.text },
                        ]}
                      >
                        “{seg.content}”
                      </Text>
                    </TouchableOpacity>
                  ));
                }

                const matchedTopics = (lec.topics || []).filter((tp) =>
                  tp.title.toLowerCase().includes(trimmed)
                );
                if (matchedTopics.length > 0) {
                  return matchedTopics.slice(0, 2).map((tp, tpIdx) => (
                    <TouchableOpacity
                      key={`topic_${tpIdx}`}
                      activeOpacity={0.88}
                      onPress={() => handleJumpToLecture(lec.id, tp.startSeconds)}
                      style={[
                        styles.snippetBox,
                        { backgroundColor: AppColors.surfaceContainerLow },
                      ]}
                    >
                      <View style={styles.snippetTopRow}>
                        <View
                          style={[
                            styles.mintTimeChip,
                            {
                              backgroundColor: AppColors.tertiaryFixed,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            },
                          ]}
                        >
                          <LlIcon
                            name="play_arrow"
                            size={10}
                            color={AppColors.onTertiaryFixed}
                            filled
                          />
                          <Text
                            style={[
                              AppTypography.labelSm,
                              {
                                color: AppColors.onTertiaryFixed,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {tp.timestamp}
                          </Text>
                        </View>
                        <Text
                          style={[
                            AppTypography.labelSm,
                            { color: colors.textSecondary },
                          ]}
                        >
                          Mục lục bài giảng
                        </Text>
                      </View>

                      <Text
                        style={[
                          AppTypography.bodyMedium,
                          styles.snippetText,
                          { color: colors.text },
                        ]}
                      >
                        {tp.title}
                      </Text>
                    </TouchableOpacity>
                  ));
                }

                if (lec.transcripts && lec.transcripts.length > 0) {
                  return lec.transcripts.slice(0, 2).map((seg, sIdx) => (
                    <TouchableOpacity
                      key={`fb_trans_${sIdx}`}
                      activeOpacity={0.88}
                      onPress={() => handleJumpToLecture(lec.id, seg.startSeconds)}
                      style={[
                        styles.snippetBox,
                        { backgroundColor: AppColors.surfaceContainerLow },
                      ]}
                    >
                      <View style={styles.snippetTopRow}>
                        <View
                          style={[
                            styles.mintTimeChip,
                            {
                              backgroundColor: AppColors.tertiaryFixed,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            },
                          ]}
                        >
                          <LlIcon
                            name="play_arrow"
                            size={10}
                            color={AppColors.onTertiaryFixed}
                            filled
                          />
                          <Text
                            style={[
                              AppTypography.labelSm,
                              {
                                color: AppColors.onTertiaryFixed,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {seg.timestamp}
                          </Text>
                        </View>
                        <Text
                          style={[
                            AppTypography.labelSm,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {seg.speaker || 'Đoạn ghi âm'}
                        </Text>
                      </View>

                      <Text
                        style={[
                          AppTypography.bodyMedium,
                          styles.snippetText,
                          { color: colors.text },
                        ]}
                      >
                        “{seg.content}”
                      </Text>
                    </TouchableOpacity>
                  ));
                }

                return (
                  <TouchableOpacity
                    onPress={() => handleJumpToLecture(lec.id, 0)}
                    style={[
                      styles.snippetBox,
                      { backgroundColor: AppColors.surfaceContainerLow },
                    ]}
                  >
                    <View style={styles.snippetTopRow}>
                      <View
                        style={[
                          styles.mintTimeChip,
                          {
                            backgroundColor: AppColors.tertiaryFixed,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          },
                        ]}
                      >
                        <LlIcon
                          name="play_arrow"
                          size={10}
                          color={AppColors.onTertiaryFixed}
                          filled
                        />
                        <Text
                          style={[
                            AppTypography.labelSm,
                            {
                              color: AppColors.onTertiaryFixed,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          00:00
                        </Text>
                      </View>
                      <Text
                        style={[
                          AppTypography.labelSm,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Khớp tiêu đề
                      </Text>
                    </View>
                    <Text
                      style={[
                        AppTypography.bodyMedium,
                        styles.snippetText,
                        { color: colors.text },
                      ]}
                    >
                      {lec.title} ({lec.subject})
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <>
            {/* Interactive Search Input Box */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.searchCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  AppShadows.card,
                ]}
              >
                <LlIcon name="search" size={22} color={colors.primary} />
                <TextInput
                  style={[AppTypography.bodyLarge, styles.searchInput, { color: colors.text }]}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Tìm khái niệm, từ khóa, công thức..."
                  placeholderTextColor="#7D7893"
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[styles.clearBtn, { backgroundColor: AppColors.surfaceContainerHigh }]}
                  >
                    <LlIcon name="close" size={14} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Recent Searches Chips (Max 4 Pastel Chips) */}
            {recentSearches.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeaderRow}>
                  <View style={styles.recentTitleGroup}>
                    <LlIcon name="clock" size={16} color={AppColors.secondary} style={{ marginRight: 6 }} />
                    <Text style={[AppTypography.labelMd, { color: AppColors.secondary, fontWeight: '700' }]}>
                      Tìm kiếm gần đây
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setRecentSearches([])}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>
                      Xóa lịch sử
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {recentSearches.map((chip, idx) => {
                    const bg =
                      chip.color === 'pink'
                        ? AppColors.secondaryContainer
                        : chip.color === 'mint'
                        ? AppColors.tertiaryFixed
                        : chip.color === 'lavender'
                        ? AppColors.surfaceContainerHigh
                        : AppColors.butterYellow;

                    const textColor =
                      chip.color === 'pink'
                        ? AppColors.onSecondaryContainer
                        : chip.color === 'mint'
                        ? AppColors.onTertiaryFixed
                        : chip.color === 'lavender'
                        ? AppColors.primary
                        : AppColors.butterYellowDark;

                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => setQuery(chip.label)}
                        style={[styles.pastelChip, { backgroundColor: bg }]}
                      >
                        <Text style={[AppTypography.labelMd, { color: textColor, fontWeight: '700' }]}>
                          {chip.label}
                        </Text>
                        <LlIcon name="north_west" size={12} color={textColor} style={{ marginLeft: 4, opacity: 0.7 }} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Search Count Status */}
            {query.trim().length > 0 && (
              <View style={styles.statusRow}>
                <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary }]}>
                  Tìm thấy{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {totalMatchingTimestamps}
                  </Text>{' '}
                  mốc thời gian trong{' '}
                  <Text style={{ color: colors.text, fontWeight: '700' }}>
                    {matchingLectures.length}
                  </Text>{' '}
                  bài giảng
                </Text>

                <View style={[styles.filterBadge, { backgroundColor: AppColors.surfaceContainerLow }]}>
                  <Text style={[AppTypography.labelSm, { color: AppColors.secondary, fontWeight: '600' }]}>
                    Tất cả môn
                  </Text>
                </View>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <View
              style={[
                styles.emptySearchCard,
                {
                  backgroundColor: colors.card,
                  borderRadius: borderRadius.modal,
                  borderColor: colors.border,
                },
                AppShadows.card,
              ]}
            >
              <CuMeoWidget variant="sleeping" size={130} />
              <Text style={[AppTypography.headlineSm, styles.emptySearchTitle, { color: colors.text }]}>
                Không tìm thấy kết quả phù hợp
              </Text>
              <Text style={[AppTypography.bodyMedium, styles.emptySearchSub, { color: colors.textSecondary }]}>
                Thử tìm kiếm với từ khóa khác như &quot;REST API&quot;, &quot;Giải tích&quot; hoặc &quot;MIPS&quot;.
              </Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSection: {
    marginBottom: 16,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  recentTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  pastelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  filterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resultsGroup: {
    gap: 16,
  },
  resultCard: {
    padding: 18,
    borderWidth: 1,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  miniSubTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  resultTitle: {
    lineHeight: 22,
  },
  micIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  snippetsList: {
    gap: 10,
  },
  snippetBox: {
    padding: 12,
    borderRadius: 16,
  },
  snippetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mintTimeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  snippetText: {
    lineHeight: 20,
  },
  emptySearchCard: {
    padding: 24,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
  },
  emptySearchTitle: {
    textAlign: 'center',
    marginTop: 14,
  },
  emptySearchSub: {
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 22,
  },
});
