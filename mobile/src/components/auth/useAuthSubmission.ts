import { useState } from 'react'
import * as Haptics from 'expo-haptics'
import type {
  AuthErrorCode,
  AuthResponse,
  SocialAuthProvider,
} from '../../modules/auth'

interface UseAuthSubmissionParams {
  onSuccess: () => void
  onServiceErrorCode: (code: AuthErrorCode | null) => void
}

/**
 * Shared submission state machine for Sign In & Create Account panes.
 * Coordinates provider locking, Haptics feedback, and gateway connectivity escalation.
 */
export function useAuthSubmission({
  onSuccess,
  onServiceErrorCode,
}: UseAuthSubmissionParams) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittingProvider, setSubmittingProvider] = useState<
    'email' | SocialAuthProvider | null
  >(null)

  const runSubmission = async (
    provider: 'email' | SocialAuthProvider,
    task: () => Promise<AuthResponse>,
    fallbackMessage: string
  ) => {
    setSubmitError(null)
    onServiceErrorCode(null)
    setSubmittingProvider(provider)

    try {
      const response = await task()
      if (response.success) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {})
        onSuccess()
        return
      }

      if (response.errorCode === 'SERVER_UNREACHABLE') {
        onServiceErrorCode('SERVER_UNREACHABLE')
        return
      }

      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {})
      setSubmitError(response.message ?? fallbackMessage)
    } finally {
      setSubmittingProvider(null)
    }
  }

  return {
    submitError,
    setSubmitError,
    submittingProvider,
    runSubmission,
  }
}
