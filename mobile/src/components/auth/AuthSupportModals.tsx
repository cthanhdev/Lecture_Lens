import React, { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  DEMO_CREDENTIALS,
  LEGAL_LAST_UPDATED,
  LEGAL_PRODUCT_SUBTITLE,
  getAuthSeam,
  getLegalDocument,
  validateUniversityEmail,
  type AuthAdapterMode,
  type LegalDocumentTab,
} from '../../modules/auth'
import type { PreviewOverrideState } from '../../modules/resilience'
import { KITSUNE_COLORS, KITSUNE_RADII, KITSUNE_SHADOWS } from '../../theme/tokens'
import { Button } from '../ui/button'
import { Icon } from '../ui/icons'
import { FormInputPill } from '../ui/input'

export interface ForgotPasswordModalProps {
  visible: boolean
  initialEmail?: string
  onClose: () => void
}

const ForgotPasswordModalContent: React.FC<{
  initialEmail: string
  onClose: () => void
}> = ({ initialEmail, onClose }) => {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string | undefined>()
  const [statusMessage, setStatusMessage] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const handleReset = async () => {
    const check = validateUniversityEmail(email)
    if (!check.isValid) {
      setError(check.message)
      return
    }
    setError(undefined)
    setSubmitting(true)
    try {
      const res = await getAuthSeam().requestPasswordReset(email)
      if (res.success) {
        setStatusMessage(res.message)
      } else {
        setError(res.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.headerBadge}>
            <Icon
              name="lock-check"
              size={18}
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
          <Text style={styles.modalTitle}>Reset password</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close reset password modal"
            style={styles.closeBtn}
          >
            <Icon name="close" size={18} strokeColor={KITSUNE_COLORS.plumInk} />
          </Pressable>
        </View>

        <Text style={styles.modalSubtitle}>
          Enter your university email and we will prepare a reset link for your
          LectureLens workspace.
        </Text>

        <FormInputPill
          label="University email"
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            if (error) setError(undefined)
          }}
          placeholder={DEMO_CREDENTIALS.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          surfaceTone="tint"
          leftIconBadgeTone="coral"
          leftIcon={
            <Icon
              name="mail"
              size={16}
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          }
          isValid={validateUniversityEmail(email).isValid}
          validBadgeTone="coral"
          error={error}
        />

        {statusMessage && (
          <View style={styles.successBanner}>
            <Icon name="check-circle" size={16} strokeColor="#2A6B4F" />
            <Text style={styles.successText}>{statusMessage}</Text>
          </View>
        )}

        <View style={styles.modalActions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={submitting}
            onPress={handleReset}
          >
            {statusMessage ? 'Send again' : 'Send reset instructions'}
          </Button>
          <Button variant="ghost" size="md" fullWidth onPress={onClose}>
            Back to Sign In
          </Button>
        </View>
      </View>
    </View>
  )
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  initialEmail = '',
  onClose,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    {visible ? (
      <ForgotPasswordModalContent
        key={initialEmail}
        initialEmail={initialEmail}
        onClose={onClose}
      />
    ) : null}
  </Modal>
)

export interface TermsPrivacyModalProps {
  visible: boolean
  initialTab?: LegalDocumentTab
  onClose: () => void
}

const TermsPrivacyModalContent: React.FC<{
  initialTab: LegalDocumentTab
  onClose: () => void
}> = ({ initialTab, onClose }) => {
  const [activeTab, setActiveTab] = useState<LegalDocumentTab>(initialTab)
  const doc = getLegalDocument(activeTab)

  return (
    <View style={styles.backdrop}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.headerBadge}>
            <Icon
              name="lock-check"
              size={18}
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
          <View style={styles.legalHeaderCopy}>
            <Text style={styles.modalTitle}>{doc.heading}</Text>
            <Text style={styles.legalMeta} numberOfLines={1}>
              Updated {LEGAL_LAST_UPDATED}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close legal modal"
            style={styles.closeBtn}
          >
            <Icon name="close" size={18} strokeColor={KITSUNE_COLORS.plumInk} />
          </Pressable>
        </View>

        <View style={styles.legalTabBar}>
          {(
            [
              { id: 'terms', label: 'Terms of Service' },
              { id: 'privacy', label: 'Privacy Policy' },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                style={[styles.legalTab, isSelected && styles.legalTabActive]}
              >
                <Text
                  style={[
                    styles.legalTabText,
                    isSelected && styles.legalTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.legalProductLine}>{LEGAL_PRODUCT_SUBTITLE}</Text>

        <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.legalLead}>{doc.subtitle}</Text>
          {doc.sections.map((section) => (
            <View key={section.id} style={styles.legalSectionCard}>
              <Text style={styles.termsHeading}>{section.title}</Text>
              <Text style={styles.termsBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>

        <Button variant="primary" size="lg" fullWidth onPress={onClose}>
          I understand
        </Button>
      </View>
    </View>
  )
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  visible,
  initialTab = 'terms',
  onClose,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    {visible ? (
      <TermsPrivacyModalContent
        key={initialTab}
        initialTab={initialTab}
        onClose={onClose}
      />
    ) : null}
  </Modal>
)

export interface ConnectionInspectorModalProps {
  visible: boolean
  isOnline: boolean
  authMode: AuthAdapterMode
  gatewayUrl: string
  previewOverride: PreviewOverrideState
  onChangePreviewOverride: (next: PreviewOverrideState) => void
  onChangeAuthMode: (next: AuthAdapterMode) => void
  onFillDemoCredentials?: () => void
  onTriggerSkeletonCheck?: () => void
  onClose: () => void
}

const PREVIEW_OPTIONS: readonly { id: PreviewOverrideState; label: string }[] = [
  { id: 'auto', label: 'Auto (Live)' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'offline', label: 'No Internet' },
  { id: 'server_error', label: 'Server Error' },
]

export const ConnectionInspectorModal: React.FC<
  ConnectionInspectorModalProps
> = ({
  visible,
  isOnline,
  authMode,
  gatewayUrl,
  previewOverride,
  onChangePreviewOverride,
  onChangeAuthMode,
  onFillDemoCredentials,
  onTriggerSkeletonCheck,
  onClose,
}) => (
  <Modal
    transparent
    visible={visible}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.backdrop}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.headerBadge}>
            <Icon
              name="settings"
              size={18}
              strokeColor={KITSUNE_COLORS.kitsuneCoralDark}
            />
          </View>
          <Text style={styles.modalTitle}>Auth & Resilience Lab</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close connection inspector"
            style={styles.closeBtn}
          >
            <Icon name="close" size={18} strokeColor={KITSUNE_COLORS.plumInk} />
          </Pressable>
        </View>

        {/* Live Telemetry Summary */}
        <View style={styles.telemetryBox}>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Network status</Text>
            <View style={styles.statusTag}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOnline
                      ? '#388E68'
                      : KITSUNE_COLORS.kitsuneCoralDark,
                  },
                ]}
              />
              <Text style={styles.statusTagText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Spring Boot Seam</Text>
            <Text style={styles.telemetryValue} numberOfLines={1}>
              {gatewayUrl}
            </Text>
          </View>
          <View style={styles.telemetryRow}>
            <Text style={styles.telemetryLabel}>Seeded Demo User</Text>
            <Text style={styles.telemetryValue}>{DEMO_CREDENTIALS.email}</Text>
          </View>
        </View>

        {/* Auth Seam Adapter Switch */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Authentication Backend Seam</Text>
          <View style={styles.chipRow}>
            {(
              [
                { id: 'mock', label: 'Mock Storage (Local)' },
                { id: 'spring', label: 'Spring Boot (/api/v1)' },
              ] as const
            ).map((opt) => {
              const active = authMode === opt.id
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => onChangeAuthMode(opt.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Screen State Preview Switch */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Preview Screen State</Text>
          <View style={styles.chipRow}>
            {PREVIEW_OPTIONS.map((opt) => {
              const active = previewOverride === opt.id
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    onChangePreviewOverride(opt.id)
                    onClose()
                  }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Quick Dev Helpers */}
        <View style={styles.modalActions}>
          {onFillDemoCredentials && (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => {
                onFillDemoCredentials()
                onClose()
              }}
            >
              Autofill Demo Account
            </Button>
          )}
          {onTriggerSkeletonCheck && (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => {
                onTriggerSkeletonCheck()
                onClose()
              }}
            >
              Replay Skeleton Loading (900ms)
            </Button>
          )}
        </View>
      </View>
    </View>
  </Modal>
)

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38, 19, 51, 0.36)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: KITSUNE_COLORS.washiCream,
    borderRadius: 28,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...KITSUNE_SHADOWS.plumModal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(244, 127, 114, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(190, 225, 208, 0.45)',
  },
  successText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  modalActions: {
    gap: 8,
    marginTop: 2,
  },
  termsScroll: {
    maxHeight: 280,
  },
  legalHeaderCopy: {
    flex: 1,
  },
  legalMeta: {
    fontSize: 11,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  legalTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
    borderRadius: KITSUNE_RADII.pill,
    padding: 4,
    gap: 4,
  },
  legalTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: KITSUNE_RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  legalTabActive: {
    backgroundColor: '#FFFFFF',
    ...KITSUNE_SHADOWS.miruku,
  },
  legalTabText: {
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  legalTabTextActive: {
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  legalProductLine: {
    fontSize: 11.5,
    color: KITSUNE_COLORS.kitsuneCoralDark,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  legalLead: {
    fontSize: 12.5,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 8,
  },
  legalSectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.06)',
  },
  termsHeading: {
    fontSize: 13,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 4,
  },
  termsBody: {
    fontSize: 12,
    lineHeight: 18,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  telemetryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.06)',
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  telemetryLabel: {
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  telemetryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(38, 19, 51, 0.05)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 11.5,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    color: KITSUNE_COLORS.plumInkMuted,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: KITSUNE_RADII.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(38, 19, 51, 0.1)',
  },
  chipActive: {
    backgroundColor: KITSUNE_COLORS.kitsuneCoral,
    borderColor: KITSUNE_COLORS.kitsuneCoral,
  },
  chipText: {
    fontSize: 12,
    color: KITSUNE_COLORS.plumInk,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
})
