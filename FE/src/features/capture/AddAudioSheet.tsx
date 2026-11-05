import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, palette, spacing, radius } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Chip, TextField, Button } from '../../shared/ui';
import { subjectRepo, lectureRepo } from '../../core/data';
import { Subject } from '../../core/domain/types';

export function AddAudioSheet() {
  const navigation = useNavigation<any>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-macro');
  const [lectureTitle, setLectureTitle] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    sizeFormatted: string;
    uri: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const data = await subjectRepo.getSubjects();
      setSubjects(data);
      if (data.length > 0) {
        setSelectedSubjectId(data[0].id);
      }
    }
    load();
  }, []);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sizeMB = asset.size ? (asset.size / (1024 * 1024)).toFixed(1) + ' MB' : '32.4 MB';
        setSelectedFile({
          name: asset.name,
          sizeFormatted: sizeMB,
          uri: asset.uri,
        });
        if (!lectureTitle) {
          // Auto-derive clean title from filename
          const cleanName = asset.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setLectureTitle(cleanName);
        }
      }
    } catch {
      // Fallback in test environment or error
      handleSampleFile();
    }
  };

  const handleSampleFile = () => {
    setSelectedFile({
      name: 'Macroeconomics_Lecture_8_Fiscal_Policy.m4a',
      sizeFormatted: '38.6 MB',
      uri: 'file://mock/audio/sample_lec8.m4a',
    });
    if (!lectureTitle) {
      setLectureTitle('Lecture 8: Fiscal Policy & Government Debt');
    }
  };

  const handleStartImport = async () => {
    if (!selectedFile) {
      Alert.alert('Please select a file', 'Choose an audio file from your device first.');
      return;
    }

    setIsUploading(true);
    const finalTitle = lectureTitle.trim() || `${currentSubject?.name || 'Academic'} Lecture`;
    const res = await lectureRepo.uploadAudio({
      title: finalTitle,
      subjectId: selectedSubjectId,
      uri: selectedFile.uri,
    });
    setIsUploading(false);

    navigation.replace('Processing', {
      lectureId: res.lecture.id,
      jobId: res.jobId,
    });
  };

  const handleLiveRecord = () => {
    navigation.replace('LiveRecording', {
      subjectId: selectedSubjectId,
    });
  };

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          variant="modal"
          title="Add Lecture Audio"
          subtitle="Record or Upload"
          onClosePress={() => navigation.goBack()}
        />
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.sheetBody}>
        {/* 1. Select Course / Subject */}
        <Text variant="meta" color="muted" style={styles.sectionLabel}>
          1. CHOOSE COURSE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectScroll}
        >
          {subjects.map((sub) => (
            <Chip
              key={sub.id}
              label={sub.name}
              subjectKey={sub.colorKey}
              selected={selectedSubjectId === sub.id}
              onPress={() => setSelectedSubjectId(sub.id)}
            />
          ))}
        </ScrollView>

        {/* 2. Lecture Title (Optional) */}
        <Text variant="meta" color="muted" style={styles.sectionLabel}>
          2. LECTURE TITLE (OPTIONAL)
        </Text>
        <TextField
          placeholder={`e.g. ${currentSubject?.name || 'Course'} Lecture`}
          value={lectureTitle}
          onChangeText={setLectureTitle}
          leftIcon={<Feather name="edit-3" size={16} color={colors.text.muted} />}
          containerStyle={styles.titleInput}
        />

        {/* 3. Choose Audio Capture Method */}
        <Text variant="meta" color="muted" style={styles.sectionLabel}>
          3. SELECT AUDIO SOURCE
        </Text>

        {/* Live Voice Record Option */}
        <GlassCard
          variant="frosted"
          padding="lg"
          style={styles.optionCard}
          onPress={handleLiveRecord}
        >
          <View style={styles.optionRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.brand.primarySoft }]}>
              <Feather name="mic" size={26} color={colors.brand.primary} />
            </View>
            <View style={styles.optionTextCol}>
              <View style={styles.optionHeaderRow}>
                <Text variant="title" color="primary">
                  Live Voice Record
                </Text>
                <View style={styles.recommendBadge}>
                  <Text variant="caption" color="coralDeep" style={styles.recommendText}>
                    In Classroom
                  </Text>
                </View>
              </View>
              <Text variant="bodySm" color="secondary" style={styles.optionDesc}>
                Instant capture in lecture hall with live waveform, AI transcription, and 1-tap star bookmarks.
              </Text>
            </View>
          </View>
          <Button
            title="Start Recording →"
            variant="primary"
            size="sm"
            onPress={handleLiveRecord}
            icon={<Feather name="mic" size={14} color="#FFFFFF" />}
            style={styles.cardActionBtn}
          />
        </GlassCard>

        {/* Import Audio File Option */}
        <GlassCard
          variant="frosted"
          padding="lg"
          style={styles.optionCard}
        >
          <View style={styles.optionRow}>
            <View style={[styles.iconCircle, { backgroundColor: palette.skyLight }]}>
              <Feather name="upload-cloud" size={26} color={palette.skyDeep} />
            </View>
            <View style={styles.optionTextCol}>
              <Text variant="title" color="primary">
                Import Audio File
              </Text>
              <Text variant="bodySm" color="secondary" style={styles.optionDesc}>
                Select MP3, M4A, or WAV recordings from device storage, Google Drive, or iCloud.
              </Text>
            </View>
          </View>

          {/* Selected File Box if any */}
          {selectedFile ? (
            <View style={styles.selectedFileBox}>
              <View style={styles.fileIconCircle}>
                <Feather name="music" size={16} color={colors.brand.primary} />
              </View>
              <View style={styles.fileDetailsCol}>
                <Text variant="bodySemibold" numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text variant="caption" color="muted">
                  {selectedFile.sizeFormatted} • Ready to transcribe
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFile(null)}
                style={styles.removeFileBtn}
              >
                <Feather name="x" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.fileActionRow}>
              <Button
                title="Choose Audio File"
                variant="secondary"
                size="sm"
                onPress={handlePickDocument}
                icon={<Feather name="folder" size={14} color={colors.text.primary} />}
              />
              <TouchableOpacity onPress={handleSampleFile} style={styles.sampleLink}>
                <Text variant="caption" color="coralDeep">
                  Or use sample lecture file
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedFile && (
            <Button
              title={isUploading ? 'Preparing Pipeline...' : 'Start AI Processing →'}
              variant="primary"
              size="sm"
              onPress={handleStartImport}
              loading={isUploading}
              style={styles.cardActionBtn}
            />
          )}
        </GlassCard>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Feather name="shield" size={14} color={colors.text.muted} />
          <Text variant="caption" color="muted" style={styles.privacyText}>
            Audio recordings are processed privately for your student account.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  sheetBody: {
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  subjectScroll: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  titleInput: {
    marginBottom: spacing.sm,
  },
  optionCard: {
    marginBottom: spacing.base,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextCol: {
    flex: 1,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendBadge: {
    backgroundColor: 'rgba(244, 127, 114, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  recommendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  optionDesc: {
    marginTop: 4,
    lineHeight: 18,
  },
  cardActionBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  fileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sampleLink: {
    paddingVertical: spacing.xs,
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  fileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetailsCol: {
    flex: 1,
  },
  removeFileBtn: {
    padding: spacing.xs,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 6,
  },
  privacyText: {
    fontSize: 12,
  },
});
