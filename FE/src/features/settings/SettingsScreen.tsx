import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Switch, Button, Divider } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function SettingsScreen() {
  const { signOut, user } = useAuth();
  const [offlineSync, setOfflineSync] = useState(true);
  const [highFidelityAudio, setHighFidelityAudio] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoSummary, setAutoSummary] = useState(true);
  const [dailyNotification, setDailyNotification] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Audio Cache',
      'This will free 44.8 MB of locally cached lecture files. Notes and summaries will remain available.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear (44.8 MB)', style: 'destructive', onPress: () => Alert.alert('Success', 'Cache cleared successfully.') },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your student account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Preferences & Settings" />}
      contentContainerStyle={styles.container}
    >
      {/* 1. Audio & Recording */}
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        AUDIO & LECTURE RECORDING
      </Text>

      <GlassCard style={styles.groupCard} padding="base">
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="download-cloud" size={16} color={colors.text.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Offline Audio Caching</Text>
              <Text variant="caption" color="muted">Store audio locally for offline playback</Text>
            </View>
          </View>
          <Switch value={offlineSync} onValueChange={setOfflineSync} />
        </View>

        <Divider />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="mic" size={16} color={colors.text.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">High-Fidelity 44.1 kHz</Text>
              <Text variant="caption" color="muted">Studio quality acoustic recording</Text>
            </View>
          </View>
          <Switch value={highFidelityAudio} onValueChange={setHighFidelityAudio} />
        </View>

        <Divider />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="volume-2" size={16} color={colors.text.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Lecture Hall Noise Filter</Text>
              <Text variant="caption" color="muted">Suppress HVAC and echo artifacts</Text>
            </View>
          </View>
          <Switch value={noiseReduction} onValueChange={setNoiseReduction} />
        </View>
      </GlassCard>

      {/* 2. Study Intelligence */}
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        AI SYNTHESIS & FLASHCARDS
      </Text>

      <GlassCard style={styles.groupCard} padding="base">
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="file-text" size={16} color={colors.brand.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Auto-Generate Cornell Notes</Text>
              <Text variant="caption" color="muted">Summaries created upon ingestion</Text>
            </View>
          </View>
          <Switch value={autoSummary} onValueChange={setAutoSummary} />
        </View>

        <Divider />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="smartphone" size={16} color={colors.text.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Haptic Feedback on Flip</Text>
              <Text variant="caption" color="muted">Vibrate on 3D card turn</Text>
            </View>
          </View>
          <Switch value={hapticFeedback} onValueChange={setHapticFeedback} />
        </View>

        <Divider />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="bell" size={16} color={colors.text.primary} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Daily Review Reminders</Text>
              <Text variant="caption" color="muted">Keep your active study streak alive</Text>
            </View>
          </View>
          <Switch value={dailyNotification} onValueChange={setDailyNotification} />
        </View>
      </GlassCard>

      {/* 3. Storage & Account */}
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        STORAGE & DATA
      </Text>

      <GlassCard style={styles.groupCard} padding="base">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClearCache}
          style={styles.clickableRow}
        >
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Feather name="trash-2" size={16} color={colors.text.muted} />
            </View>
            <View style={styles.textCol}>
              <Text variant="bodySemibold">Clear Audio Cache</Text>
              <Text variant="caption" color="muted">44.8 MB stored on device</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </GlassCard>

      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        ACCOUNT
      </Text>

      <GlassCard style={styles.groupCard} padding="base">
        <View style={styles.accountRow}>
          <View style={styles.accountAvatar}>
            <Feather name="user" size={20} color={colors.text.primary} />
          </View>
          <View style={styles.accountTextCol}>
            <Text variant="title" style={{ fontSize: 15 }}>
              {user?.fullName || 'Minh Nguyen'}
            </Text>
            <Text variant="caption" color="muted">
              {user?.email || 'minh.nguyen@lecturelens.edu.vn'}
            </Text>
          </View>
        </View>
      </GlassCard>

      <Button
        title="Sign Out of Account"
        variant="ghost"
        size="md"
        fullWidth
        onPress={handleSignOut}
        icon={<Feather name="log-out" size={16} color={colors.status.failed.text} />}
        style={styles.signOutBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  groupCard: {
    marginBottom: spacing.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  clickableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  textCol: {
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  accountTextCol: {
    flex: 1,
  },
  signOutBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
