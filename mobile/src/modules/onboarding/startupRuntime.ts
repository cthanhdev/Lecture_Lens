// Runtime bridge connecting LaunchPreflight with React Native NetInfo & Gateway ApiClient
// Kept separate from launchPreflight.ts so Node unit tests never pull RN native modules
import NetInfo from '@react-native-community/netinfo'
import { Platform } from 'react-native'
import { ApiClient, setPlatformOS } from '../../services/apiClient'
import { networkMonitor, type NetworkProvider } from '../../services/networkMonitor'
import type { NetworkStatus } from '../../services/types'
import { appStorage } from '../storage'
import { getAuthSeam } from '../auth'
import { runLaunchBootstrap } from './launchPreflight'
import type {
  LaunchBootstrapResult,
  PreflightProgressEvent,
  StartupPreparer,
} from './types'

function createNetInfoProvider(): NetworkProvider {
  const mapState = (state: {
    isConnected: boolean | null
    isInternetReachable: boolean | null
    type: string
  }): NetworkStatus => ({
    isConnected: state.isConnected ?? true,
    isInternetReachable: state.isInternetReachable,
    type: state.type || 'unknown',
  })

  return {
    subscribe: (listener) => {
      try {
        return NetInfo.addEventListener((state) => {
          listener(mapState(state))
        })
      } catch {
        return () => {}
      }
    },
    getStatus: async () => {
      try {
        const state = await NetInfo.fetch()
        return mapState(state)
      } catch {
        return { isConnected: true, isInternetReachable: true, type: 'unknown' }
      }
    },
  }
}

/**
 * Default extensible startup preparers executed during Screen 01 Splash loading.
 * Add server warmup / preference sync / catalog prefetch hooks here as backend APIs come online.
 */
export const DEFAULT_STARTUP_PREPARERS: readonly StartupPreparer[] = [
  {
    id: 'network-monitor-bind',
    label: 'Bind live network monitor',
    run: async () => {
      if (Platform.OS !== 'web') {
        networkMonitor.setProvider(createNetInfoProvider())
      }
    },
  },
]

export interface RuntimePreflightOptions {
  onProgress?: (event: PreflightProgressEvent) => void
  extraPreparers?: readonly StartupPreparer[]
  stepTimeoutMs?: number
  minDisplayMs?: number
}

/**
 * Executes Splash bootstrap with live platform resolution, NetInfo check,
 * fast-timeout server health ping (`/api/v1/health`), and registered preparers.
 */
export async function runLaunchPreflightRuntime(
  options?: RuntimePreflightOptions
): Promise<LaunchBootstrapResult> {
  const platformOs =
    Platform.OS === 'android'
      ? 'android'
      : Platform.OS === 'ios'
        ? 'ios'
        : 'web'
  setPlatformOS(platformOs)

  const preflightClient = new ApiClient({
    storage: appStorage,
    timeoutMs: options?.stepTimeoutMs ?? 1200,
  })

  return runLaunchBootstrap({
    storage: appStorage,
    authSeam: getAuthSeam(),
    checkNetwork: async () => {
      try {
        const state = await NetInfo.fetch()
        return state.isConnected !== false
      } catch {
        return true
      }
    },
    checkServerHealth: async () => {
      try {
        const health = await preflightClient.checkHealth()
        return Boolean(health)
      } catch {
        return false
      }
    },
    preparers: [
      ...DEFAULT_STARTUP_PREPARERS,
      ...(options?.extraPreparers ?? []),
    ],
    onProgress: options?.onProgress,
    stepTimeoutMs: options?.stepTimeoutMs ?? 1200,
    minDisplayMs: options?.minDisplayMs ?? 1100,
  })
}
