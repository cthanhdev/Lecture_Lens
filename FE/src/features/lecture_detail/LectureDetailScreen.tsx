import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { LlIcon, LlIconName } from '../../shared/widgets/icons/LlIcon';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { AudioPlayerCapsule } from '../../shared/widgets/audio/AudioPlayerCapsule';
import { StickyNoteCard } from '../../shared/widgets/cards/StickyNoteCard';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { CuMeoWidget } from '../../shared/widgets/mascot/CuMeoWidget';
import { LectureDetailSkeleton } from '../../shared/widgets/skeleton/SkeletonShimmer';
import { useLectureStore } from '../../shared/stores/useLectureStore';
import { useAudioPlayerStore } from '../../shared/stores/useAudioPlayerStore';
import { formatDuration } from '../../core/utils/formatters';
import { filterTranscripts } from '../../core/utils/transcriptUtils';

type LectureDetailScreenProps = {
  route: RouteProp<RootStackParamList, 'LectureDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'LectureDetail'>;
};

const SUGGESTED_QUESTIONS = [
  'Tóm tắt bài giảng',
  'REST API là gì?',
  'So sánh PUT và PATCH',
  'Mã HTTP phổ biến',
];

export const LectureDetailScreen = ({ route, navigation }: LectureDetailScreenProps) => {
  const { lectureId, initialTabIndex = 1 } = route.params;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const { colors, borderRadius } = useAppTheme();
  const lectures = useLectureStore((state) => state.lectures);
  const seekTo = useAudioPlayerStore((state) => state.seekTo);
  const play = useAudioPlayerStore((state) => state.play);
  const positionSeconds = useAudioPlayerStore((state) => state.positionSeconds);

  const lecture = lectures.find((l) => l.id === lectureId) || lectures[0];

  const [activeTab, setActiveTab] = useState(initialTabIndex);
  const [chatInput, setChatInput] = useState('');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [isSkeletonDemo, setIsSkeletonDemo] = useState(false);
  const [messages, setMessages] = useState(lecture?.aiMessages || [
    {
      id: 'msg_init_1',
      sender: 'user' as const,
      content: 'Thầy giải thích tại sao REST API lại phải là Stateless ở phút thứ mấy vậy bạn?',
      timestamp: '14:02',
    },
    {
      id: 'msg_init_2',
      sender: 'cu_meo' as const,
      content: 'Thầy giải thích cơ chế Stateless (Vô trạng thái) rất kỹ ở mốc 12:35! Mỗi request client gửi lên phải tự chứa đủ token/thông tin xác thực, server không cần lưu trạng thái session.',
      timestamp: 'Vừa xong',
      citationTime: '12:35',
      citationSeconds: 755,
    },
  ]);

  const handleJumpToTime = (seconds: number) => {
    seekTo(seconds);
    play();
  };


  const handleSendChat = (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user' as const,
      content: text,
      timestamp: 'Vừa xong',
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const cuMeoReply = {
        id: `msg_${Date.now() + 1}`,
        sender: 'cu_meo' as const,
        content: `Cú Mèo đã đối chiếu: Vấn đề "${text}" được giảng viên nhấn mạnh trong bài học với trích đoạn âm thanh gốc bên dưới. Bạn nhấn vào để nghe lại nhé!`,
        timestamp: 'Vừa xong',
        citationTime: '12:35',
        citationSeconds: 755,
      };
      setMessages((prev) => [...prev, cuMeoReply]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 900);
  };

  if (!lecture) {
    return (
      <DotBackground>
        <LlAppBar
          title="Chi Tiết Bài Giảng"
          showBack={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <CuMeoWidget size={100} variant="sleeping" />
          <Text style={[AppTypography.titleMedium, { color: colors.text, marginTop: 16 }]}>
            Không tìm thấy bài giảng
          </Text>
          <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
            Bài giảng này không tồn tại hoặc đã bị xóa khỏi thư viện.
          </Text>
        </View>
      </DotBackground>
    );
  }

  const rawTranscripts = lecture.transcripts || [];
  const totalCount = rawTranscripts.length;
  const filteredTranscripts = filterTranscripts(rawTranscripts, transcriptSearch);
  const matchCount = transcriptSearch.trim().length > 0 ? filteredTranscripts.length : totalCount;

  if (isSkeletonDemo) {
    return (
      <DotBackground>
        <LlAppBar
          title="Đang tải bài giảng..."
          showBack={true}
          onBackPress={() => setIsSkeletonDemo(false)}
        />
        <LectureDetailSkeleton />
      </DotBackground>
    );
  }

  return (
    <DotBackground>
      <LlAppBar
        title="Chi Tiết Bài Giảng"
        subtitle={lecture.subject}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        actions={
          <View style={styles.topActionsRow}>
            <TouchableOpacity
              onPress={() => Alert.alert('Chia sẻ bài giảng', 'Đã sao chép liên kết ghi chú!')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.roundActionBtn, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <LlIcon name="share" size={18} color={colors.primary} />
            </TouchableOpacity>
            {__DEV__ && (
              <TouchableOpacity
                onPress={() => setIsSkeletonDemo(!isSkeletonDemo)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={[styles.roundActionBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <LlIcon name="sync" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, activeTab === 2 && { paddingBottom: 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* TOP META & TITLE CARD (Notebook Stationery Style) */}
        <View
          style={[
            styles.metaNotebookCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          {/* Washi tape topper */}
          <View style={styles.cardTape}>
            <WashiTapeAccent color="sakura" width={56} height={12} rotation="-1deg" />
          </View>

          <View style={styles.cardBadgeRow}>
            <View style={[styles.subjectPill, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                {lecture.subject}
              </Text>
            </View>
            <View style={[styles.termPill, { backgroundColor: AppColors.tertiaryFixed }]}>
              <Text style={[AppTypography.labelSm, { color: AppColors.onTertiaryFixed, fontWeight: '700' }]}>
                Kỳ 2 - 2024
              </Text>
            </View>
          </View>

          <Text style={[AppTypography.headlineMd, styles.lectureTitle, { color: colors.text }]}>
            {lecture.title}
          </Text>

          <View style={styles.subMetaRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <LlIcon name="clock" size={13} color={colors.textSecondary} />
              <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                {formatDuration(lecture.durationSeconds || 2720)}
              </Text>
            </View>
            <Text style={[styles.metaDot, { color: colors.border }]}>•</Text>
            <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
              {lecture.relativeTime || '14 Thg 10, 2024'}
            </Text>
          </View>
        </View>

        {/* PINNED STICKY AUDIO PLAYER CAPSULE */}
        <AudioPlayerCapsule title={lecture.title} subject={lecture.subject} />

        {/* NOTEBOOK SEGMENTED NAVIGATION TABS */}
        <View style={styles.tabBarWrapper}>
          <View style={[styles.segmentedTabBar, { backgroundColor: colors.surfaceContainerHigh }]}>
            {[
              { idx: 0, label: 'Mục lục', icon: 'toc' as LlIconName },
              { idx: 1, label: 'Bản ghi', icon: 'description' as LlIconName },
              { idx: 2, label: 'Hỏi đáp AI', icon: 'chat_bubble' as LlIconName },
            ].map((tab) => {
              const isActive = activeTab === tab.idx;
              return (
                <TouchableOpacity
                  key={tab.idx}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab(tab.idx)}
                  style={[
                    styles.tabButton,
                    isActive && [
                      styles.tabButtonActive,
                      { backgroundColor: colors.card },
                      AppShadows.card,
                    ],
                  ]}
                >
                  <LlIcon
                    name={tab.icon}
                    size={14}
                    color={isActive ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      AppTypography.labelMd,
                      {
                        color: isActive ? colors.primary : colors.textSecondary,
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.idx === 2 && <View style={styles.qaNewPip} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TAB 0: MỤC LỤC (TOC) */}
        {activeTab === 0 && (
          <View style={styles.tabContentArea}>
            {lecture.topics && lecture.topics.length > 0 ? (
              lecture.topics.map((topic, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.88}
                  onPress={() => handleJumpToTime(topic.startSeconds)}
                  style={[
                    styles.topicItemCard,
                    {
                      backgroundColor: colors.card,
                      borderRadius: borderRadius.card,
                      borderColor: colors.border,
                    },
                    AppShadows.card,
                  ]}
                >
                  <View style={[styles.topicIndexBadge, { backgroundColor: colors.surfaceContainer }]}>
                    <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                      {i + 1}
                    </Text>
                  </View>

                  <View style={styles.topicInfoCol}>
                    <Text style={[AppTypography.labelLarge, { color: colors.text }]}>
                      {topic.title}
                    </Text>
                    <Text style={[AppTypography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
                      Bắt đầu lúc: {topic.timestamp}
                    </Text>
                  </View>

                  <View style={[styles.timestampPillBtn, { backgroundColor: AppColors.tertiaryFixed, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <LlIcon name="play_arrow" size={10} color={AppColors.onTertiaryFixed} filled />
                    <Text style={[AppTypography.labelSm, { color: AppColors.onTertiaryFixed, fontWeight: '700' }]}>
                      {topic.timestamp}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginVertical: 30 }]}>
                Đang tạo mục lục bài giảng tự động...
              </Text>
            )}
          </View>
        )}

        {/* TAB 1: BẢN GHI (TRANSCRIPT VIEW) */}
        {activeTab === 1 && (
          <View style={styles.tabContentArea}>
            {/* Search Bar inside Transcript */}
            <View
              style={[
                styles.transcriptSearchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
                AppShadows.card,
              ]}
            >
              <LlIcon name="search" size={18} color={colors.primary} />
              <TextInput
                style={[AppTypography.bodyMedium, styles.transcriptSearchInput, { color: colors.text }]}
                value={transcriptSearch}
                onChangeText={setTranscriptSearch}
                placeholder="Tìm trong bản ghi..."
                placeholderTextColor={colors.textSecondary}
              />
              {transcriptSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setTranscriptSearch('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ marginRight: 6 }}
                >
                  <LlIcon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <View style={[styles.matchCounterBadge, { backgroundColor: colors.surfaceContainerLow, flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                  {matchCount}/{totalCount}
                </Text>
                <LlIcon name="swap_vert" size={14} color={colors.primary} style={{ marginLeft: 3 }} />
              </View>
            </View>

            {/* Cú Mèo Assistant Audio Sync Chip */}
            <View style={[styles.audioSyncChip, { backgroundColor: AppColors.secondaryFixed }]}>
              <View style={[styles.syncIconBox, { backgroundColor: AppColors.secondaryContainer }]}>
                <LlIcon name="headphones" size={14} color={AppColors.onSecondaryFixed} />
              </View>
              <Text style={[AppTypography.bodySmall, { color: AppColors.onSecondaryFixed, flex: 1, fontWeight: '600' }]}>
                Cú Mèo đang đồng bộ thời gian thực theo giọng giảng của giảng viên.
              </Text>
            </View>

            {/* Transcript Timeline Blocks */}
            {filteredTranscripts.length > 0 ? (
              filteredTranscripts.map((seg, i) => {
                const isNearActive =
                  positionSeconds >= seg.startSeconds && positionSeconds < seg.startSeconds + 300;

                return (
                  <View
                    key={i}
                    style={[
                      styles.transcriptCard,
                      {
                        backgroundColor: isNearActive ? '#FDEEF3' : colors.card,
                        borderRadius: borderRadius.card,
                        borderColor: isNearActive ? AppColors.sakuraPink : colors.border,
                      },
                      AppShadows.card,
                    ]}
                  >
                    <View style={styles.transcriptCardHeader}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleJumpToTime(seg.startSeconds)}
                        style={[
                          styles.timestampPillBtn,
                          {
                            backgroundColor: isNearActive
                              ? AppColors.primaryContainer
                              : AppColors.tertiaryFixed,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          },
                        ]}
                      >
                        <LlIcon
                          name="play_arrow"
                          size={10}
                          color={isNearActive ? '#FFFFFF' : AppColors.onTertiaryFixed}
                          filled
                        />
                        <Text
                          style={[
                            AppTypography.labelSm,
                            {
                              color: isNearActive ? '#FFFFFF' : AppColors.onTertiaryFixed,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {seg.timestamp}
                        </Text>
                      </TouchableOpacity>

                      {isNearActive ? (
                        <View style={[styles.playingBadge, { backgroundColor: AppColors.secondaryContainer }]}>
                          <View style={styles.pingPlayingDot} />
                          <Text style={[AppTypography.labelSm, { color: AppColors.onSecondaryContainer, fontWeight: '700' }]}>
                            Đang phát
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LlIcon name="mic" size={12} color={colors.primary} />
                          <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '600' }]}>
                            {seg.speaker}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[AppTypography.bodyLarge, styles.transcriptContentText, { color: colors.text }]}>
                      {seg.content}
                    </Text>

                    {/* Attached Sticky Note if Key Point */}
                    {seg.stickyNoteText && (
                      <StickyNoteCard
                        variant="yellow"
                        title="Trọng tâm ôn thi Cú Mèo note"
                        text={seg.stickyNoteText}
                        showPin={true}
                        showTape={true}
                        tapeColor="yellow"
                        jumpLabel={`Nghe đoạn này (${seg.timestamp})`}
                        onJumpPress={() => handleJumpToTime(seg.startSeconds)}
                      />
                    )}
                  </View>
                );
              })
            ) : (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={[AppTypography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
                  {transcriptSearch.trim().length > 0
                    ? `Không tìm thấy đoạn ghi âm phù hợp với "${transcriptSearch}"`
                    : 'Chưa có bản ghi âm cho bài giảng này.'}
                </Text>
              </View>
            )}

            {/* Cheerful End of Transcript Card */}
            <View style={[styles.endMascotCard, { backgroundColor: colors.surfaceContainer }]}>
              <View style={[styles.endMascotIconBox, { backgroundColor: colors.card }]}>
                <CuMeoWidget variant="happy" size={36} isAnimated={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[AppTypography.headlineSm, { color: colors.text }]}>
                  Bạn đã ghi chú được 45%
                </Text>
                <Text style={[AppTypography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                  Nhấn vào bất kỳ mốc thời gian nào để Cú Mèo phát lại đoạn giảng đó nhé!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: HỎI ĐÁP AI (Q&A WITH CITATIONS) */}
        {activeTab === 2 && (
          <View style={styles.tabContentArea}>
            {/* Suggested Question Chips (Washi Desk Strips) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedChipsRow}>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  onPress={() => handleSendChat(q)}
                  style={[
                    styles.suggestedChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    AppShadows.card,
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {idx === 0 && (
                      <LlIcon name="auto_awesome" size={13} color={colors.primary} filled style={{ marginRight: 5 }} />
                    )}
                    <Text style={[AppTypography.labelSm, { color: colors.primary, fontWeight: '700' }]}>
                      {q}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chat Messages Feed */}
            <View style={styles.chatFeed}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[styles.chatRow, isUser ? styles.chatRowUser : styles.chatRowCuMeo]}
                  >
                    {!isUser && (
                      <View style={[styles.cuMeoChatAvatar, { backgroundColor: colors.surfaceContainerHighest }]}>
                        <CuMeoWidget variant="happy" size={26} isAnimated={false} />
                      </View>
                    )}

                    <View
                      style={[
                        styles.chatBubble,
                        isUser
                          ? [styles.userBubble, { backgroundColor: colors.primary }]
                          : [styles.cuMeoBubble, { backgroundColor: colors.card, borderColor: colors.border }],
                        AppShadows.card,
                      ]}
                    >
                      {!isUser && (
                        <View style={styles.cuMeoHeaderRow}>
                          <View style={styles.cuMeoNameBadge}>
                            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
                              Cú Mèo AI
                            </Text>
                            <View style={[styles.assistantTag, { backgroundColor: AppColors.secondaryFixed }]}>
                              <Text style={[AppTypography.labelSm, { color: AppColors.onSecondaryFixed, fontWeight: '700' }]}>
                                Trợ giảng
                              </Text>
                            </View>
                          </View>
                          <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>
                            {msg.timestamp}
                          </Text>
                        </View>
                      )}

                      <Text
                        style={[
                          AppTypography.bodyMedium,
                          { color: isUser ? '#FFFFFF' : colors.text, lineHeight: 22 },
                        ]}
                      >
                        {msg.content}
                      </Text>

                      {/* Sticky Note Citation Cards attached to Cú Mèo's answers */}
                      {!isUser && msg.citationTime && (
                        <View style={styles.citationsSection}>
                          <StickyNoteCard
                            variant="yellow"
                            title="Nguyên lý Stateless"
                            timestamp="12:35 - 14:10"
                            text="“...Máy chủ không giữ bất kỳ ngữ cảnh nào của client giữa các yêu cầu. Mỗi request là độc lập hoàn toàn...”"
                            showPin={true}
                            jumpLabel="Nghe đoạn này (12:35)"
                            onJumpPress={() => handleJumpToTime(msg.citationSeconds || 755)}
                          />

                          <StickyNoteCard
                            variant="pink"
                            title="Token JWT trong Stateless"
                            timestamp="24:50 - 26:15"
                            text="“...Chính vì stateless nên chúng ta sử dụng JSON Web Token mang theo thông tin phân quyền...”"
                            showPin={true}
                            jumpLabel="Nghe đoạn này (24:50)"
                            onJumpPress={() => handleJumpToTime(1490)}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: activeTab === 2 ? 20 : 60 }} />
      </ScrollView>

      {/* Sticky Fixed Desk Input Bar at bottom when on Tab 2 */}
      {activeTab === 2 && (
        <View
          style={[
            styles.fixedInputContainer,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 12),
              borderTopColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.bottomInputBar,
              { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
              AppShadows.floatingPill,
            ]}
          >
            <TextInput
              style={[AppTypography.bodyMedium, styles.qaTextInput, { color: colors.text }]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Hỏi về bài giảng này..."
              placeholderTextColor="#7D7893"
              onSubmitEditing={() => handleSendChat()}
            />
            <TouchableOpacity
              onPress={() => Alert.alert('Ghi âm câu hỏi', 'Đang nhận diện giọng nói câu hỏi của bạn...')}
              style={styles.micInputBtn}
              accessibilityRole="button"
              accessibilityLabel="Ghi âm câu hỏi"
            >
              <LlIcon name="mic" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => handleSendChat()}
              style={[styles.sendInputBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Gửi câu hỏi"
            >
              <LlIcon name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaNotebookCard: {
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  subjectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  termPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  lectureTitle: {
    marginBottom: 8,
    lineHeight: 28,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaDot: {
    fontSize: 10,
  },
  tabBarWrapper: {
    marginVertical: 10,
  },
  segmentedTabBar: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9999,
    position: 'relative',
  },
  tabButtonActive: {},
  qaNewPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.secondary,
    position: 'absolute',
    top: 6,
    right: 12,
  },
  tabContentArea: {
    marginTop: 8,
    gap: 12,
  },
  topicItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  topicIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topicInfoCol: {
    flex: 1,
    marginRight: 10,
  },
  timestampPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  transcriptSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
  },
  transcriptSearchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
  },
  matchCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  audioSyncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 6,
  },
  syncIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  transcriptCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  transcriptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pingPlayingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.secondary,
    marginRight: 5,
  },
  transcriptContentText: {
    lineHeight: 24,
    marginBottom: 6,
  },
  endMascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginTop: 10,
  },
  endMascotIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  suggestedChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  suggestedChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chatFeed: {
    gap: 14,
    marginVertical: 10,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chatRowUser: {
    justifyContent: 'flex-end',
  },
  chatRowCuMeo: {
    justifyContent: 'flex-start',
  },
  cuMeoChatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  chatBubble: {
    maxWidth: '82%',
    padding: 14,
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 4,
  },
  cuMeoBubble: {
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    flex: 1,
  },
  cuMeoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cuMeoNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assistantTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  citationsSection: {
    marginTop: 10,
    gap: 8,
  },
  fixedInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 9999,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  qaTextInput: {
    flex: 1,
    height: '100%',
  },
  micInputBtn: {
    padding: 6,
    marginRight: 4,
  },
  sendInputBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
