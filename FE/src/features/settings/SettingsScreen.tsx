import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Switch, Button, Divider } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function SettingsScreen() {
  const { signOut, user } = useAuth();
  const [offlineSync, setOfflineSync] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [highQualityAudio, setHighQualityAudio] = useState(false);

  return (
    <Screen
      scrollable
      header={<AppHeader variant="detail" title="Settings" />}
      contentContainerStyle={styles.container}
    >
      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        STUDY PREFERENCES
      </Text>

      <GlassCard style={styles.settingGroupCard} padding="base">
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="download-cloud" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.settingLabel}>
              Offline Audio Caching
            </Text>
          </View>
          <Switch value={offlineSync} onValueChange={setOfflineSync} />
        </View>

        <Divider />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="mic" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.settingLabel}>
              High-Fidelity Stereo Audio
            </Text>
          </View>
          <Switch value={highQualityAudio} onValueChange={setHighQualityAudio} />
        </View>

        <Divider />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Feather name="smartphone" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.settingLabel}>
              Haptic Feedback on Card Flip
            </Text>
          </View>
          <Switch value={hapticFeedback} onValueChange={setHapticFeedback} />
        </View>
      </GlassCard>

      <Text variant="meta" color="muted" style={styles.sectionTitle}>
        ACCOUNT
      </Text>

      <GlassCard style={styles.settingGroupCard} padding="base">
        <View style={styles.settingRow}>
          <View>
            <Text variant="bodySemibold">{user?.fullName || 'Minh Nguyen'}</Text>
            <Text variant="caption" color="muted">{user?.email}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </View>
      </GlassCard>

      <Button
        title="Sign Out"
        variant="ghost"
        size="md"
        fullWidth
        onPress={signOut}
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
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  settingGroupCard: {
    marginBottom: spacing.base,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    marginLeft: spacing.base,
  },
  signOutBtn: {
    marginTop: spacing.xl,
  },
});
