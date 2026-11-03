import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../core/theme/ThemeContext';
import { AppColors } from '../../core/theme/colors';
import { AppTypography } from '../../core/theme/typography';
import { AppShadows } from '../../core/theme/layout';
import { LlIcon } from '../../shared/widgets/icons/LlIcon';
import { DotBackground } from '../../shared/widgets/DotBackground';
import { LlAppBar } from '../../shared/widgets/navigation/LlAppBar';
import { WashiTapeAccent } from '../../shared/widgets/washi_tape/WashiTapeAccent';
import { useLectureStore } from '../../shared/stores/useLectureStore';

type UploadScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Upload'>;
};

export const UploadScreen = ({ navigation }: UploadScreenProps) => {
  const { colors, borderRadius } = useAppTheme();
  const addLecture = useLectureStore((state) => state.addLecture);

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    duration?: string;
  } | null>({
    name: 'Bai_giang_REST_API_05.m4a',
    size: '42.5 MB',
    duration: '45 phút',
  });

  const [title, setTitle] = useState('Lập trình Web - Bài 5: REST API');
  const [subject, setSubject] = useState('Công nghệ phần mềm');
  const [university, setUniversity] = useState('ĐH Bách Khoa');

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const sizeMb = ((file.size || 0) / (1024 * 1024)).toFixed(1);
        setSelectedFile({
          name: file.name,
          size: `${sizeMb} MB`,
          duration: 'Ước tính 45 phút',
        });
        if (!title || title === 'Lập trình Web - Bài 5: REST API') {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      Alert.alert('Thông báo', 'Không thể mở trình chọn tệp tin.');
    }
  };

  const handleStartProcessing = () => {
    if (!title.trim()) {
      Alert.alert('Chưa nhập tiêu đề', 'Vui lòng điền tên bài giảng để tiếp tục.');
      return;
    }

    const newId = `lec_${Date.now()}`;
    addLecture({
      id: newId,
      title: title.trim(),
      subject: subject.trim(),
      university: university.trim(),
      status: 'processing',
      processingProgress: 0.65,
      processingStatusText: 'Đang xử lý mô hình Whisper AI...',
      remainingTimeText: 'Còn khoảng 45 giây',
      audioFileName: selectedFile?.name || 'lecture_audio.m4a',
      audioFileSize: selectedFile?.size || '42.5 MB',
      durationSeconds: 2720,
      relativeTime: 'Vừa xong',
      topics: [
        { title: 'Mở đầu & Giới thiệu REST API', timestamp: '00:00', startSeconds: 0, isCompleted: true },
        { title: 'Đặc tính Stateless & Client-Server', timestamp: '12:35', startSeconds: 755, isCompleted: false },
        { title: 'Các phương thức HTTP (GET, POST, PUT, DELETE)', timestamp: '18:40', startSeconds: 1120, isCompleted: false },
        { title: 'Xác thực JWT Token trong REST API', timestamp: '24:50', startSeconds: 1490, isCompleted: false },
      ],
      transcripts: [
        {
          timestamp: '02:15',
          startSeconds: 135,
          speaker: 'Thầy Hoàng',
          content: 'Hôm nay chúng ta sẽ tìm hiểu về nguyên lý REST API trong thiết kế web service. Đây là tiêu chuẩn nền tảng giúp hệ thống frontend và backend giao tiếp mạch lạc với nhau.',
        },
        {
          timestamp: '12:35',
          startSeconds: 755,
          speaker: 'Thầy Hoàng',
          content: 'REST API hoạt động theo kiến trúc Client-Server vô trạng thái (Stateless). Mỗi request từ phía client gửi lên máy chủ phải chứa đầy đủ mọi thông tin xác thực cần thiết mà không phụ thuộc vào session lưu trên server.',
          isKeyPoint: true,
          stickyNoteText: 'Nhớ kỹ đặc tính Stateless: Server không lưu session ID của client giữa các request liên tiếp.',
        },
        {
          timestamp: '18:40',
          startSeconds: 1120,
          speaker: 'Thầy Hoàng',
          content: 'Về các phương thức HTTP cơ bản: GET để đọc dữ liệu, POST để tạo mới, PUT cập nhật toàn phần, PATCH cập nhật một phần và DELETE để xoá dữ liệu.',
        },
        {
          timestamp: '24:50',
          startSeconds: 1490,
          speaker: 'Thầy Hoàng',
          content: 'Chính vì stateless nên chúng ta sử dụng JSON Web Token mang theo thông tin phân quyền của người dùng được mã hóa Base64 và ký bằng bí mật HMAC.',
          isKeyPoint: true,
          stickyNoteText: 'JWT Token: Bearer token chứa payload và chữ ký HMAC-SHA256, không lưu session server.',
        },
      ],
      aiMessages: [
        {
          id: 'msg_01',
          sender: 'user',
          content: 'Thầy giải thích tại sao REST API lại phải là Stateless ở phút thứ mấy vậy bạn?',
          timestamp: '14:02',
        },
        {
          id: 'msg_02',
          sender: 'cu_meo',
          content: 'Thầy giải thích cơ chế Stateless (Vô trạng thái) rất kỹ ở mốc 12:35! Mỗi request client gửi lên phải tự chứa đủ token/thông tin xác thực, server không cần lưu trạng thái session.',
          timestamp: 'Vừa xong',
          citationTime: '12:35',
          citationSeconds: 755,
        },
      ],
    });

    navigation.navigate('Processing', { lectureId: newId });
  };

  return (
    <DotBackground>
      <LlAppBar
        title="Tải Lên & Ghi Âm"
        subtitle="Chuẩn bị bài học mới"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
        {/* VIEW 1: UPLOAD DROPZONE CARD */}
        <View
          style={[
            styles.dropzoneCard,
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
            <WashiTapeAccent color="sakura" width={60} height={12} rotation="-1deg" />
          </View>

          {/* Cloud upload bubble */}
          <View style={[styles.cloudCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
            <LlIcon name="cloud_upload" size={38} color={colors.primary} />
          </View>

          <Text style={[AppTypography.headlineSm, styles.cardTitle, { color: colors.text }]}>
            Chọn file ghi âm bài giảng
          </Text>

          <Text style={[AppTypography.bodyMedium, styles.cardSub, { color: colors.textSecondary }]}>
            Hỗ trợ định dạng mp3, m4a, wav (tối đa 500MB) từ điện thoại hoặc máy ghi âm
          </Text>

          {/* Primary Action Button: Browse files */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handlePickAudio}
            style={[
              styles.browseBtn,
              { backgroundColor: colors.primary },
              AppShadows.buttonPrimary,
            ]}
          >
            <LlIcon name="folder_open" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
              Duyệt tệp tin trên máy
            </Text>
          </TouchableOpacity>

          {/* Divider with "hoặc" */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[AppTypography.labelSm, { color: colors.textSecondary }]}>HOẶC</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Secondary Action Button: Instant Record */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Ghi âm trực tiếp', 'Đang kết nối micro để ghi âm bài giảng tại lớp.')}
            style={[styles.recordBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          >
            <LlIcon name="mic" size={18} color={AppColors.error} />
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700', marginLeft: 8 }]}>
              Ghi âm trực tiếp ngay bây giờ
            </Text>
          </TouchableOpacity>
        </View>

        {/* VIEW 2: FILE PREVIEW & METADATA CARD */}
        <View
          style={[
            styles.metaCard,
            {
              backgroundColor: colors.card,
              borderRadius: borderRadius.modal,
              borderColor: colors.border,
            },
            AppShadows.card,
          ]}
        >
          {/* File Header Chip if file exists */}
          {selectedFile && (
            <View style={[styles.filePreviewChip, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={[styles.fileIconBox, { backgroundColor: AppColors.tertiaryFixed }]}>
                <LlIcon name="graphic_eq" size={20} color={AppColors.onTertiaryFixed} />
              </View>
              <View style={styles.fileInfoCol}>
                <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={[AppTypography.bodySmall, { color: colors.textSecondary }]}>
                  {selectedFile.size} • {selectedFile.duration || '45 phút'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.closeFileBtn}>
                <LlIcon name="close" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Lecture Title Input */}
          <View style={styles.formGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700', marginBottom: 6 }]}>
              Tên bài giảng <Text style={{ color: AppColors.error }}>*</Text>
            </Text>
            <View style={[styles.formInputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <TextInput
                style={[AppTypography.bodyMedium, styles.formInput, { color: colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhập tên bài học..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Subject Input */}
          <View style={styles.formGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700', marginBottom: 6 }]}>
              Môn học
            </Text>
            <View style={[styles.formInputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <TextInput
                style={[AppTypography.bodyMedium, styles.formInput, { color: colors.text }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Ví dụ: Công nghệ phần mềm"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* University Input */}
          <View style={styles.formGroup}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700', marginBottom: 6 }]}>
              Trường học / Học viện
            </Text>
            <View style={[styles.formInputBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
              <TextInput
                style={[AppTypography.bodyMedium, styles.formInput, { color: colors.text }]}
                value={university}
                onChangeText={setUniversity}
                placeholder="Ví dụ: ĐH Bách Khoa"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          {/* Language Selector */}
          <View style={styles.langRow}>
            <Text style={[AppTypography.labelMd, { color: colors.text, fontWeight: '700' }]}>
              Ngôn ngữ bài giảng
            </Text>
            <View style={[styles.langBadge, { backgroundColor: AppColors.tertiaryFixed }]}>
              <LlIcon name="translate" size={14} color={AppColors.onTertiaryFixed} style={{ marginRight: 6 }} />
              <Text style={[AppTypography.labelSm, { color: AppColors.onTertiaryFixed, fontWeight: '700', marginRight: 4 }]}>
                Tiếng Việt
              </Text>
              <LlIcon name="check_circle" size={14} color={AppColors.tertiary} filled />
            </View>
          </View>

          {/* Submit Action: Tiến hành phân tích & bóc băng */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartProcessing}
            style={[
              styles.startProcBtn,
              { backgroundColor: colors.primary },
              AppShadows.buttonPrimary,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={[AppTypography.labelLarge, { color: '#FFFFFF', fontWeight: '700' }]}>
                Tiến hành phân tích & bóc băng
              </Text>
              <LlIcon name="arrow_forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </DotBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dropzoneCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  cardTape: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
  },
  cloudCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSub: {
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 290,
    lineHeight: 22,
  },
  browseBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  recordBtn: {
    width: '100%',
    height: 48,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCard: {
    padding: 20,
    borderWidth: 1,
  },
  filePreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    marginBottom: 16,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fileInfoCol: {
    flex: 1,
  },
  closeFileBtn: {
    padding: 8,
  },
  formGroup: {
    marginBottom: 14,
  },
  formInputBox: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE8F5',
  },
  formInput: {
    height: '100%',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  startProcBtn: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
});
