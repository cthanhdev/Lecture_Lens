import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard } from '../../shared/ui';

export function AddAudioSheet() {
  const navigation = useNavigation<any>();

  const handleLiveRecord = () => {
    navigation.replace('LiveRecording', { subjectId: 'subj-macro' });
  };

  const handleImportFile = () => {
    // Navigate to processing with mock uploaded lecture
    navigation.replace('Processing', {
      lectureId: 'lec-7',
      jobId: 'job-mock-upload',
    });
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Add Lecture Audio"
          subtitle="Choose source"
        />
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.sheetBody}>
        {/* Live Voice Record Option */}
        <GlassCard
          variant="frosted"
          padding="xl"
          style={styles.optionCard}
          onPress={handleLiveRecord}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.brand.primarySoft }]}>
            <Feather name="mic" size={28} color={colors.brand.primary} />
          </View>
          <View style={styles.optionTextCol}>
            <Text variant="title" color="primary">
              Live Voice
            </Text>
            <Text variant="body" color="secondary" style={styles.optionDesc}>
              Instant capture in the lecture hall with live waveform & bookmarking.
            </Text>
          </View>
        </GlassCard>

        {/* Import Audio File Option */}
        <GlassCard
          variant="frosted"
          padding="xl"
          style={styles.optionCard}
          onPress={handleImportFile}
        >
          <View style={[styles.iconCircle, { backgroundColor: palette.skyLight }]}>
            <Feather name="upload-cloud" size={28} color={palette.skyDeep} />
          </View>
          <View style={styles.optionTextCol}>
            <Text variant="title" color="primary">
              Import File
            </Text>
            <Text variant="body" color="secondary" style={styles.optionDesc}>
              Select MP3, M4A, or WAV audio files from device or cloud drives.
            </Text>
          </View>
        </GlassCard>

        <View style={styles.privacyNote}>
          <Feather name="lock" size={14} color={colors.text.muted} />
          <Text variant="caption" color="muted" style={{ marginLeft: 6 }}>
            Recordings stay private to your local account.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sheetBody: {
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  optionTextCol: {
    flex: 1,
  },
  optionDesc: {
    marginTop: 2,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
