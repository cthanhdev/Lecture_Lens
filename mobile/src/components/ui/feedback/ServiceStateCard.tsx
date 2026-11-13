import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  SERVICE_ISSUE_COPY,
  type ServiceIssueKind,
} from '../../../modules/resilience/connectionResilience'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../../theme/tokens'
import { Button } from '../button'
import { Icon } from '../icons'

export interface ServiceStateCardProps {
  kind: ServiceIssueKind
  onRetry: () => void
  onContinueDemo?: () => void
  isRetrying?: boolean
  customSubtitle?: string
}

/**
 * Kitsune Soft recovery card for No Internet (Offline) and Spring Boot Server Error states.
 * Renders inside a frosted Miruku Glass squircle with Mochi tactile CTA recovery options.
 */
export const ServiceStateCard: React.FC<ServiceStateCardProps> = ({
  kind,
  onRetry,
  onContinueDemo,
  isRetrying = false,
  customSubtitle,
}) => {
  const copy = SERVICE_ISSUE_COPY[kind]
  const isOffline = kind === 'offline'

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Soft halo stage */}
        <View
          style={[
            styles.haloCircle,
            isOffline ? styles.offlineHalo : styles.serverHalo,
          ]}
        >
          <View style={styles.innerIconCard}>
            <Icon
              name={copy.iconName}
              size={34}
              strokeColor={
                isOffline ? KITSUNE_COLORS.kitsuneCoralDark : KITSUNE_COLORS.kitsuneCoral
              }
            />
          </View>
          <View style={styles.sparkleBadge}>
            <Icon
              name={isOffline ? 'sparkles' : 'refresh'}
              size={14}
              strokeColor={KITSUNE_COLORS.plumInk}
            />
          </View>
        </View>

        {/* Status badge pill */}
        <View
          style={[
            styles.statusPill,
            isOffline ? styles.offlinePill : styles.serverPill,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isOffline
                  ? KITSUNE_COLORS.kitsuneCoralDark
                  : '#D48A00',
              },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              isOffline ? styles.offlinePillText : styles.serverPillText,
            ]}
          >
            {copy.badge}
          </Text>
        </View>

        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{customSubtitle || copy.subtitle}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isRetrying}
            onPress={onRetry}
            leftIcon={<Icon name="refresh" size={18} strokeColor="#FFFFFF" />}
            accessibilityLabel={copy.primaryActionLabel}
          >
            {copy.primaryActionLabel}
          </Button>

          {onContinueDemo && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onPress={onContinueDemo}
              leftIcon={
                <Icon
                  name="sparkles"
                  size={18}
                  strokeColor={KITSUNE_COLORS.kitsuneCoral}
                />
              }
              accessibilityLabel={copy.secondaryActionLabel}
            >
              {copy.secondaryActionLabel}
            </Button>
          )}
        </View>

        <Text style={styles.helperFootnote}>
          Local demo accounts stay safely saved on this device.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingVertical: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  haloCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  offlineHalo: {
    backgroundColor: 'rgba(245, 195, 201, 0.34)',
  },
  serverHalo: {
    backgroundColor: 'rgba(255, 226, 122, 0.32)',
  },
  innerIconCard: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...KITSUNE_SHADOWS.miruku,
  },
  sparkleBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: KITSUNE_COLORS.mochiYellow,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: KITSUNE_RADII.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  offlinePill: {
    backgroundColor: 'rgba(244, 127, 114, 0.14)',
  },
  serverPill: {
    backgroundColor: 'rgba(255, 226, 122, 0.42)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  offlinePillText: {
    color: KITSUNE_COLORS.kitsuneCoralDark,
  },
  serverPillText: {
    color: KITSUNE_COLORS.plumInk,
  },
  title: {
    fontSize: 21,
    lineHeight: 28,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  helperFootnote: {
    marginTop: 14,
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInkSubtle,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
  },
})
