import { useState, useEffect, useCallback } from 'react'
import type { BackendConnectionState } from '../domain/auth.types.ts'
import { getAuthSeam } from './authSeam.ts'

export interface BackendHealthState {
  connectionState: BackendConnectionState
  isOnline: boolean
  isBackendReachable: boolean
  isSimulatedLoading: boolean
  checkNow: () => Promise<void>
  toggleSimulatedLoading: () => void
}

export function useBackendHealth(): BackendHealthState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [connectionState, setConnectionState] = useState<BackendConnectionState>('checking')
  const [isSimulatedLoading, setIsSimulatedLoading] = useState<boolean>(false)

  const checkHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false)
      setConnectionState('offline')
      return
    }

    setIsOnline(true)
    setConnectionState('checking')

    try {
      const isHealthy = await getAuthSeam().checkBackendHealth()
      setConnectionState(isHealthy ? 'connected' : 'backend_unreachable')
    } catch {
      setConnectionState('backend_unreachable')
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Bắt đầu kiểm tra kết nối bất đồng bộ
    const initialCheck = async () => {
      const healthy = await getAuthSeam().checkBackendHealth()
      if (isMounted) {
        setConnectionState(healthy ? 'connected' : 'backend_unreachable')
      }
    }

    void initialCheck()

    const handleOnline = () => {
      setIsOnline(true)
      void initialCheck()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionState('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      isMounted = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const toggleSimulatedLoading = useCallback(() => {
    setIsSimulatedLoading((prev) => !prev)
  }, [])

  return {
    connectionState,
    isOnline,
    isBackendReachable: connectionState === 'connected',
    isSimulatedLoading,
    checkNow: checkHealth,
    toggleSimulatedLoading,
  }
}
