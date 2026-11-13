// Runtime bridge initializing AuthSeam with persistent AsyncStorageAdapter
// Kept separate from authSeam.ts so pure Node tests never pull React Native / AsyncStorage modules.
import { Platform } from 'react-native'
import type { AuthAdapterMode } from '../domain/auth.types'
import { appStorage } from '../../storage'
import { resolveDefaultBaseUrl, setPlatformOS } from '../../../services/apiClient'
import {
  AUTH_MODE_KEY,
  MockAuthAdapter,
  SpringBootAuthAdapter,
  getAuthSeam,
  setAuthSeam,
} from './authSeam'

let initialized = false

function resolveGatewayUrl(): string {
  const os =
    Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web'
      ? Platform.OS
      : 'unknown'
  setPlatformOS(os)
  return resolveDefaultBaseUrl(os)
}

export function createAdapterForMode(mode: AuthAdapterMode) {
  if (mode === 'spring') {
    return new SpringBootAuthAdapter({
      baseUrl: resolveGatewayUrl(),
      storage: appStorage,
    })
  }
  return new MockAuthAdapter(appStorage, 220)
}

export async function initAuthRuntime(): Promise<AuthAdapterMode> {
  if (initialized) {
    return getAuthSeam().mode
  }

  let savedMode: AuthAdapterMode = 'mock'
  try {
    const raw = await appStorage.getItem(AUTH_MODE_KEY)
    if (raw === 'spring' || raw === 'mock') {
      savedMode = raw
    }
  } catch {
    savedMode = 'mock'
  }

  setAuthSeam(createAdapterForMode(savedMode))
  initialized = true
  return savedMode
}

export async function switchAuthAdapterMode(
  mode: AuthAdapterMode,
): Promise<AuthAdapterMode> {
  setAuthSeam(createAdapterForMode(mode))
  initialized = true
  try {
    await appStorage.setItem(AUTH_MODE_KEY, mode)
  } catch {
    // Non-blocking preference persistence
  }
  return mode
}

export function getActiveGatewayUrl(): string {
  return resolveGatewayUrl()
}
