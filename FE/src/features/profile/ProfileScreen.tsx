import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, spacing } from '../../core/theme';
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
              style={styles.settingsHeaderBtn}
            >
              <Feather name="settings" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          }
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* 2. Centered Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={48} color={colors.text.primary} />
          </View>
          <View style={styles.activeDot} />
        </View>

        <Text variant="h1" style={styles.name}>
          {user?.fullName || 'Minh Nguyen'}
        </Text>
        <Text variant="body" color="secondary" style={styles.university}>
          {user?.university || 'Ho Chi Minh City Open University'}
        </Text>
        <View style={styles.chipsRow}>
          <Chip
            label={user?.major || 'Economics & Computing'}
            subjectKey="macroeconomics"
          />
          <Chip label="Class of 2027" />
        </View>
      </View>

      {/* 3. Bento Stat Grid */}
      <View style={styles.bentoRow}>
        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">LECTURES</Text>
          <Text variant="h1" color="primary" style={styles.bentoNumber}>
            19
          </Text>
          <Text variant="caption" color="secondary">Captured</Text>
        </GlassCard>

        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">STREAK</Text>
          <Text variant="h1" color="coralDeep" style={styles.bentoNumber}>
            12
          </Text>
          <Text variant="caption" color="secondary">Days 🔥</Text>
        </GlassCard>

        <GlassCard style={styles.bentoTile} padding="base">
          <Text variant="caption" color="muted">CARDS</Text>
          <Text variant="h1" color="primary" style={styles.bentoNumber}>
            166
          </Text>
          <Text variant="caption" color="secondary">Mastered</Text>
        </GlassCard>
      </View>

      {/* 4. Study Activity Heatmap Card */}
      <GlassCard variant="frosted" padding="base" style={styles.heatmapCard}>
        <View style={styles.heatmapHeader}>
          <View>
            <Text variant="title">Study Momentum</Text>
            <Text variant="caption" color="muted">Weekly lecture & card hours</Text>
          </View>
          <Chip label="+18% vs last wk" subjectKey="econ201" />
        </View>

        <View style={styles.chartBarsRow}>
          {[
            { day: 'Mon', height: 42, hours: '1.5h' },
            { day: 'Tue', height: 68, hours: '2.4h' },
            { day: 'Wed', height: 50, hours: '1.8h' },
            { day: 'Thu', height: 80, hours: '3.1h' },
            { day: 'Fri', height: 56, hours: '2.0h' },
            { day: 'Sat', height: 28, hours: '1.0h' },
            { day: 'Sun', height: 34, hours: '1.2h' },
          ].map((bar, idx) => (
            <View key={idx} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: bar.height },
                    idx === 3 && styles.barPeak,
                  ]}
                />
              </View>
              <Text variant="caption" color="muted" style={styles.barLabel}>
                {bar.day}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* 5. Upgrade to Plus Promo Card */}
      <GlassCard variant="frosted" padding="xl" style={styles.promoCard}>
        <View style={styles.promoHeader}>
          <View style={styles.promoTitleRow}>
            <View style={styles.starBox}>
              <Feather name="star" size={16} color="#FFFFFF" />
            </View>
            <Text variant="title" color="coralDeep">
              Kitsune Plus
            </Text>
          </View>
          <Chip label="STUDENT PRO" subjectKey="cellBiology" />
        </View>
        <Text variant="body" color="secondary" style={styles.promoDesc}>
          Unlock unlimited PhoWhisper neural voice transcriptions, Cornell notes & full offline audio caching.
        </Text>
        <Button
          title="Upgrade for $4.99/mo"
          variant="primary"
          size="md"
          onPress={() => navigation.navigate('Paywall')}
          style={styles.promoBtn}
        />
      </GlassCard>

      {/* 6. Grouped Menu Bento Card */}
      <GlassCard style={styles.menuCard} padding="base">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Subjects')}
          style={styles.menuRow}
        >
          <View style={styles.menuLeft}>
            <Feather name="folder" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.menuLabel}>
              Enrolled Courses & Syllabi
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LibraryTab')}
          style={styles.menuRow}
        >
          <View style={styles.menuLeft}>
            <Feather name="download-cloud" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.menuLabel}>
              Offline Audio Library (44.8 MB)
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Settings')}
          style={styles.menuRow}
        >
          <View style={styles.menuLeft}>
            <Feather name="sliders" size={18} color={colors.text.primary} />
            <Text variant="bodySemibold" style={styles.menuLabel}>
              App & Audio Preferences
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.base,
  },
  settingsHeaderBtn: {
    padding: spacing.xs,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.base,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.bg.surface,
    borderWidth: 2,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.mintDeep,
    borderWidth: 2,
    borderColor: colors.bg.canvas,
  },
  name: {
    fontSize: 22,
    marginBottom: 2,
  },
  university: {
    marginBottom: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bentoTile: {
    flex: 1,
    alignItems: 'center',
  },
  bentoNumber: {
    marginVertical: 2,
  },
  heatmapCard: {
    marginBottom: spacing.lg,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  chartBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: spacing.sm,
  },
  barCol: {
    alignItems: 'center',
    width: 28,
  },
  barTrack: {
    height: 80,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.bg.container,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: colors.brand.primarySoft,
  },
  barPeak: {
    backgroundColor: colors.brand.primary,
  },
  barLabel: {
    marginTop: spacing.xs,
    fontSize: 10,
  },
  promoCard: {
    marginBottom: spacing.lg,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  promoDesc: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  promoBtn: {
    marginTop: spacing.md,
  },
  menuCard: {
    marginBottom: spacing.xxl,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    marginLeft: spacing.base,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
});
