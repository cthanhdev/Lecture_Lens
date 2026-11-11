// Network Monitor Seam (Matt Pocock Deep Module Pattern)
import { useEffect, useState } from 'react'
import type { NetworkStatus } from './types.ts'

export interface NetworkProvider {
  subscribe(listener: (status: NetworkStatus) => void): () => void
  getStatus(): Promise<NetworkStatus> | NetworkStatus
}

export class MockNetworkProvider implements NetworkProvider {
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }
  private listeners: Set<(status: NetworkStatus) => void> = new Set()

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener)
    listener(this.getStatus())
    return () => {
      this.listeners.delete(listener)
    }
  }

  public setStatus(status: Partial<NetworkStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...status }
    for (const listener of this.listeners) {
      listener(this.getStatus())
    }
  }
}

export class NetworkMonitor {
  private static instance: NetworkMonitor
  private provider: NetworkProvider
  private listeners: Set<(status: NetworkStatus) => void> = new Set()
  private unsubscribeProvider?: () => void
  private cachedStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  }

  private constructor(provider: NetworkProvider = new MockNetworkProvider()) {
    this.provider = provider
    this.bindProvider(provider)
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor()
    }
    return NetworkMonitor.instance
  }

  public setProvider(provider: NetworkProvider): void {
    if (this.unsubscribeProvider) {
      this.unsubscribeProvider()
      this.unsubscribeProvider = undefined
    }
    this.provider = provider
    this.bindProvider(provider)
  }

  private bindProvider(provider: NetworkProvider): void {
    this.unsubscribeProvider = provider.subscribe((status) => {
      this.cachedStatus = status
      for (const listener of this.listeners) {
        listener(status)
      }
    })
  }

  public getStatus(): NetworkStatus {
    return { ...this.cachedStatus }
  }

  public subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener)
    listener(this.getStatus())
    return () => {
      this.listeners.delete(listener)
    }
  }

  public setMockStatus(status: Partial<NetworkStatus>): void {
    if (this.provider instanceof MockNetworkProvider) {
      this.provider.setStatus(status)
    } else {
      this.cachedStatus = { ...this.cachedStatus, ...status }
      for (const listener of this.listeners) {
        listener(this.cachedStatus)
      }
    }
  }

  public destroy(): void {
    if (this.unsubscribeProvider) {
      this.unsubscribeProvider()
      this.unsubscribeProvider = undefined
    }
    this.listeners.clear()
  }
}

export const networkMonitor = NetworkMonitor.getInstance()

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => networkMonitor.getStatus())

  useEffect(() => {
    return networkMonitor.subscribe((newStatus) => {
      setStatus(newStatus)
    })
  }, [])

  return status
}
