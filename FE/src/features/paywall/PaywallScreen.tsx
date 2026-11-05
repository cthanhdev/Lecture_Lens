import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, palette, radius, spacing } from '../../core/theme';
import { Screen, AppHeader } from '../../shared/components';
import { Text, GlassCard, Button, Chip } from '../../shared/ui';

export function PaywallScreen() {
  const navigation = useNavigation<any>();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleStartTrial = () => {
    navigation.goBack();
  };

  return (
    <Screen
      header={
        <AppHeader
          variant="modal"
          title="Kitsune Plus"
          onClosePress={() => navigation.goBack()}
        />
      }
      contentContainerStyle={styles.container}
    >
      <View style={styles.heroBox}>
        <View style={styles.badgeBox}>
          <Feather name="star" size={32} color={palette.mochiGold} />
        </View>
        <Text variant="display" center style={styles.title}>
          Elevate Your GPA
        </Text>
        <Text variant="body" color="secondary" center style={styles.desc}>
          Supercharge lectures with unlimited PhoWhisper neural transcripts, auto flashcards & smart Cornell notes.
        </Text>
      </View>

      {/* Feature Checkpoints */}
      <GlassCard variant="frosted" padding="base" style={styles.featuresCard}>
        {[
          'Unlimited Lecture Audio Transcription',
          'Automated Cornell Notes & Formulas',
          'Spaced Repetition Smart Decks',
          'Full Offline Audio & Card Sync',
        ].map((feat, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={styles.checkIcon}>
              <Feather name="check" size={14} color={palette.mintDeep} />
            </View>
            <Text variant="bodySemibold" style={styles.featureText}>
              {feat}
            </Text>
          </View>
        ))}
      </GlassCard>

      {/* Plan Selector */}
      <View style={styles.plansRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedPlan('annual')}
          style={[
            styles.planTile,
            selectedPlan === 'annual' && styles.planTileActive,
          ]}
        >
          <Chip label="BEST VALUE" subjectKey="cellBiology" style={styles.planBadge} />
          <Text variant="title">Annual</Text>
          <Text variant="h2" color="coralDeep" style={styles.priceText}>
            $4.99 <Text variant="caption">/mo</Text>
          </Text>
          <Text variant="caption" color="muted">Billed $59.99/yr</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelectedPlan('monthly')}
          style={[
            styles.planTile,
            selectedPlan === 'monthly' && styles.planTileActive,
          ]}
        >
          <Text variant="title" style={{ marginTop: 20 }}>Monthly</Text>
          <Text variant="h2" color="primary" style={styles.priceText}>
            $7.99 <Text variant="caption">/mo</Text>
          </Text>
          <Text variant="caption" color="muted">Flexible billing</Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Start 7-Day Free Trial"
        variant="primary"
        size="lg"
        fullWidth
        onPress={handleStartTrial}
        style={styles.trialBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  heroBox: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  badgeBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primarySoft,
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
    gap: spacing.sm,
    marginVertical: spacing.base,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  featureText: {
    flex: 1,
  },
  plansRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginVertical: spacing.md,
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
  trialBtn: {
    marginTop: spacing.sm,
  },
});
