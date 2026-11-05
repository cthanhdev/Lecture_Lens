import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button, Chip } from '../../shared/ui';
import { useAuth } from '../../core/auth';

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          variant="detail"
          title="Student Profile"
          rightAction={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Settings')}
            >
              <Feather name="settings" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Feather name="user" size={44} color={colors.text.primary} />
        </View>
        <Text variant="h1" style={styles.name}>
          {user?.fullName || 'Minh Nguyen'}
        </Text>
        <Text variant="body" color="secondary" style={styles.school}>
          {user?.university || 'Ho Chi Minh City Open University'}
        </Text>
        <Chip label={user?.major || 'Economics & Computing'} style={styles.majorChip} />
      </View>

      {/* Bento Stat Grid */}
      <View style={styles.bentoRow}>
        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">LECTURES</Text>
          <Text variant="display" color="primary">19</Text>
          <Text variant="caption" color="secondary">Captured</Text>
        </GlassCard>

        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">STREAK</Text>
          <Text variant="display" color="coralDeep">12</Text>
          <Text variant="caption" color="secondary">Days 🔥</Text>
        </GlassCard>

        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">FLASHCARDS</Text>
          <Text variant="display" color="primary">166</Text>
          <Text variant="caption" color="secondary">Mastered</Text>
        </GlassCard>
      </View>

      {/* Upgrade to Plus Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.promoCard}>
        <View style={styles.promoHeader}>
          <Text variant="title" color="coralDeep">
            ★ Kitsune Plus
          </Text>
          <Chip label="PRO" />
        </View>
        <Text variant="body" color="secondary" style={styles.promoDesc}>
          Unlock unlimited PhoWhisper voice transcription, Cornell auto-notes, and full offline sync.
        </Text>
        <Button
          title="Upgrade to Plus"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('Paywall')}
          style={{ marginTop: spacing.md }}
        />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.base,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bg.container,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  name: {
    marginBottom: 2,
  },
  school: {
    marginBottom: spacing.sm,
  },
  majorChip: {
    marginTop: spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  bentoTile: {
    flex: 1,
    alignItems: 'center',
  },
  promoCard: {
    marginBottom: spacing.xl,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDesc: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
