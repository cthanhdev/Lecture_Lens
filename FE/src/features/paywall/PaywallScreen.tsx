import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, radius, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button, Chip } from '../../shared/ui';

export function PaywallScreen() {
  const navigation = useNavigation<any>();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleStartTrial = () => {
    Alert.alert(
      'Trial Activated!',
      'Welcome to Kitsune Plus. You now have full access to unlimited neural transcriptions and offline decks.',
      [{ text: 'Awesome', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <Screen
      scrollable
      header={
        <AppHeader
          variant="modal"
          title="Kitsune Plus"
          subtitle="Upgrade your learning studio"
          onClosePress={() => navigation.goBack()}
        />
      }
      contentContainerStyle={styles.container}
    >
      {/* Hero Branding */}
      <View style={styles.heroBox}>
        <View style={styles.ambientOrb} />
        <View style={styles.badgeBox}>
          <Feather name="award" size={36} color={colors.brand.primary} />
        </View>
        <Text variant="display" center style={styles.title}>
          Unlock Your Full Potential
        </Text>
        <Text variant="body" color="secondary" center style={styles.desc}>
          Turn hours of lecture audio into retention-ready study materials with our local neural engine.
        </Text>
      </View>

      {/* Feature Checkpoints */}
      <GlassCard variant="frosted" padding="base" style={styles.featuresCard}>
        {[
          { icon: 'mic', title: 'Unlimited Voice Capture', desc: 'PhoWhisper ASR with no duration caps' },
          { icon: 'book-open', title: 'Cornell Lecture Outlines', desc: 'Auto-synthesized key ideas & cues' },
          { icon: 'layers', title: 'Smart Flashcard Generation', desc: 'Spaced repetition tailored to your exam dates' },
          { icon: 'download-cloud', title: 'Complete Offline Audio Sync', desc: 'Listen & review anywhere without internet' },
        ].map((feat, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={styles.checkIcon}>
              <Feather name="check" size={14} color={palette.mintDeep} />
            </View>
            <View style={styles.featTextCol}>
              <Text variant="bodySemibold">{feat.title}</Text>
              <Text variant="caption" color="muted">{feat.desc}</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Plan Selector (Annual vs Monthly) */}
      <View style={styles.plansRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedPlan('annual')}
          style={[
            styles.planTile,
            selectedPlan === 'annual' && styles.planTileActive,
          ]}
        >
          <Chip label="SAVE 38%" subjectKey="cellBiology" style={styles.planBadge} />
          <Text variant="title">Annual Plan</Text>
          <Text variant="h2" color="coralDeep" style={styles.priceText}>
            $4.99 <Text variant="caption">/mo</Text>
          </Text>
          <Text variant="caption" color="muted">Billed $59.99/year</Text>
          <Text variant="caption" color="secondary" style={styles.trialHighlight}>
            7 days free
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedPlan('monthly')}
          style={[
            styles.planTile,
            selectedPlan === 'monthly' && styles.planTileActive,
          ]}
        >
          <Text variant="title" style={{ marginTop: 22 }}>Monthly</Text>
          <Text variant="h2" color="primary" style={styles.priceText}>
            $7.99 <Text variant="caption">/mo</Text>
          </Text>
          <Text variant="caption" color="muted">Flexible billing</Text>
          <Text variant="caption" color="muted" style={styles.trialHighlight}>
            Cancel anytime
          </Text>
        </TouchableOpacity>
      </View>

      {/* CTA Button */}
      <Button
        title="Start 7-Day Free Trial"
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleStartTrial}
        style={styles.trialBtn}
      />

      <Text variant="caption" color="muted" center style={styles.disclaimerText}>
        Recurring billing. Cancel anytime in Apple App Store / Google Play settings before your trial ends.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.base,
    paddingBottom: spacing.xxl,
  },
  heroBox: {
    alignItems: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  ambientOrb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.brand.primarySoft,
    opacity: 0.5,
    top: -10,
  },
  badgeBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    marginBottom: 4,
  },
  desc: {
    lineHeight: 20,
    paddingHorizontal: spacing.base,
  },
  featuresCard: {
    gap: spacing.base,
    marginVertical: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  featTextCol: {
    flex: 1,
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginVertical: spacing.base,
  },
  planTile: {
    flex: 1,
    padding: spacing.base,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.surface,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    alignItems: 'center',
  },
  planTileActive: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft + '22',
  },
  planBadge: {
    marginBottom: spacing.xs,
  },
  priceText: {
    marginVertical: 4,
  },
  trialHighlight: {
    marginTop: 4,
    fontWeight: '700',
  },
  trialBtn: {
    marginTop: spacing.base,
  },
  disclaimerText: {
    marginTop: spacing.base,
    lineHeight: 16,
    paddingHorizontal: spacing.xl,
  },
});
