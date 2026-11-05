import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../core/theme';
import {
  Text,
  Button,
  IconButton,
  Chip,
  StatusBadge,
  GlassCard,
  ProgressBar,
  TimestampPill,
  SegmentedControl,
  TextField,
  Switch,
  Divider,
} from '../../shared/ui';

export function GalleryScreen() {
  const [selectedSegment, setSelectedSegment] = useState<'summary' | 'highlights' | 'transcript' | 'cards'>('summary');
  const [switchVal, setSwitchVal] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedChip, setSelectedChip] = useState('All');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="display" color="primary">
            Kitsune UI Kit
          </Text>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Design tokens & Atom components gallery (Expo SDK 58)
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge status="LIVE" label="Kitsune Soft v2.0" />
            <StatusBadge status="READY" label="Atoms Complete" />
          </View>
        </View>

        <Divider />

        {/* Typography */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">1. Typography Scale</Text>
          <Text variant="display">Display 30px</Text>
          <Text variant="h1">Heading 1 26px</Text>
          <Text variant="h2">Heading 2 22px</Text>
          <Text variant="h3">Heading 3 18px</Text>
          <Text variant="title">Title Semibold 16px</Text>
          <Text variant="body">Body Regular 14px — Clean academic legibility</Text>
          <Text variant="meta" color="muted">Meta 12px · Nov 4 · 48:20</Text>
          <Text variant="label" color="coralDeep">LABEL SEMIBOLD 11PX</Text>
          <Text variant="caption" color="secondary">CAPTION 10PX</Text>
        </View>

        <Divider />

        {/* Buttons */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">2. Buttons & CTAs</Text>
          <Button
            title="Start today's review"
            variant="primary"
            size="lg"
            fullWidth
            icon={<Feather name="play" size={18} color="#FFFFFF" />}
            onPress={() => Alert.alert('Action', 'Primary CTA pressed')}
            style={styles.componentSpacing}
          />

          <View style={styles.row}>
            <Button
              title="Record voice"
              variant="secondary"
              size="md"
              icon={<Feather name="mic" size={16} color={colors.brand.primaryDeep} />}
              onPress={() => {}}
            />
            <Button
              title="Upload a file"
              variant="glass"
              size="md"
              icon={<Feather name="upload" size={16} color={colors.text.primary} />}
              onPress={() => {}}
            />
          </View>

          <View style={[styles.row, styles.componentSpacing]}>
            <Button title="Small Ghost" variant="ghost" size="sm" onPress={() => {}} />
            <Button title="Loading State" variant="primary" size="sm" loading onPress={() => {}} />
          </View>

          <View style={styles.row}>
            <IconButton
              icon={<Feather name="arrow-left" size={20} color={colors.text.primary} />}
              variant="glass"
            />
            <IconButton
              icon={<Feather name="mic" size={22} color="#FFFFFF" />}
              variant="coral"
              size={56}
            />
            <IconButton
              icon={<Feather name="more-horizontal" size={20} color={colors.text.primary} />}
              variant="glass"
            />
            <IconButton
              icon={<Feather name="bookmark" size={20} color={colors.brand.primary} />}
              variant="filled"
            />
          </View>
        </View>

        <Divider />

        {/* Chips & Subjects */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">3. Chips & Subject Badges</Text>
          <View style={[styles.row, styles.wrap]}>
            <Chip
              label="All"
              count={6}
              selected={selectedChip === 'All'}
              onPress={() => setSelectedChip('All')}
            />
            <Chip
              label="Macroeconomics"
              subjectKey="macroeconomics"
              selected={selectedChip === 'Macroeconomics'}
              onPress={() => setSelectedChip('Macroeconomics')}
            />
            <Chip
              label="Organic Chemistry"
              subjectKey="organicChemistry"
              selected={selectedChip === 'Organic Chemistry'}
              onPress={() => setSelectedChip('Organic Chemistry')}
            />
            <Chip
              label="Cell Biology"
              subjectKey="cellBiology"
            />
            <Chip
              label="Psychology"
              subjectKey="psychology"
            />
          </View>
        </View>

        <Divider />

        {/* Status Badges & Timestamps */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">4. Statuses & Timestamps</Text>
          <View style={[styles.row, styles.wrap]}>
            <StatusBadge status="READY" />
            <StatusBadge status="TRANSCRIBING" />
            <StatusBadge status="LIVE" />
            <StatusBadge status="DUE" />
            <StatusBadge status="FAILED" />
          </View>

          <View style={[styles.row, styles.componentSpacing]}>
            <TimestampPill
              timeStr="12:41"
              variant="primary"
              onPress={() => Alert.alert('Seek', 'Jumped to 12:41')}
            />
            <TimestampPill
              timeStr="15:20"
              variant="subtle"
              onPress={() => Alert.alert('Seek', 'Jumped to 15:20')}
            />
          </View>
        </View>

        <Divider />

        {/* Segmented Control */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">5. Segmented Navigation</Text>
          <SegmentedControl
            options={[
              { key: 'summary', label: 'Summary' },
              { key: 'highlights', label: 'Highlights', badge: 3 },
              { key: 'transcript', label: 'Transcript' },
              { key: 'cards', label: 'Cards' },
            ]}
            selectedKey={selectedSegment}
            onSelect={(k) => setSelectedSegment(k as any)}
          />
        </View>

        <Divider />

        {/* Glass Bento Cards & Progress */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">6. Bento Glass Cards</Text>
          <GlassCard style={styles.componentSpacing}>
            <View style={styles.cardHeader}>
              <Text variant="label" color="coralDeep">CONTINUE LISTENING</Text>
              <Chip label="Macroeconomics" subjectKey="macroeconomics" />
            </View>
            <Text variant="title" style={{ marginTop: spacing.xs }}>
              Lecture 7: Inflation & Monetary Policy
            </Text>
            <Text variant="meta" color="muted" style={{ marginBottom: spacing.md }}>
              Chapter 4: Macroeconomic Indicators & Central Banks
            </Text>
            <ProgressBar progress={0.62} fillColor={colors.brand.primary} />
            <View style={styles.cardFooter}>
              <Text variant="caption" color="muted">29:58 / 48:20 (1.25x)</Text>
              <IconButton
                icon={<Feather name="play" size={16} color="#FFFFFF" />}
                variant="coral"
                size={36}
              />
            </View>
          </GlassCard>

          <View style={styles.row}>
            <GlassCard style={styles.halfCard} padding="base">
              <Text variant="caption" color="muted">DUE TODAY</Text>
              <Text variant="display" color="primary">34</Text>
              <Text variant="caption" color="secondary">Cards due</Text>
            </GlassCard>
            <GlassCard style={styles.halfCard} padding="base">
              <Text variant="caption" color="muted">STREAK</Text>
              <Text variant="display" color="coralDeep">12</Text>
              <Text variant="caption" color="secondary">Days in a row</Text>
            </GlassCard>
          </View>
        </View>

        <Divider />

        {/* Form Controls */}
        <View style={styles.section}>
          <Text variant="h3" color="primary">7. Inputs & Switches</Text>
          <TextField
            label="Search Lectures"
            placeholder="Search keywords, topics, timestamps..."
            value={inputText}
            onChangeText={setInputText}
            leftIcon={<Feather name="search" size={18} color={colors.text.muted} />}
          />
          <TextField
            label="Password Field"
            placeholder="Enter password..."
            isPassword
            leftIcon={<Feather name="lock" size={18} color={colors.text.muted} />}
          />
          <View style={styles.switchRow}>
            <Text variant="bodySemibold">Offline Sync Mode</Text>
            <Switch value={switchVal} onValueChange={setSwitchVal} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  header: {
    marginBottom: spacing.base,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  componentSpacing: {
    marginTop: spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  halfCard: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    padding: spacing.base,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});
