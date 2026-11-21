import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import type { NetworkProvider } from './networkMonitor'
import type { NetworkStatus } from './types'

function mapNetInfoState(state: NetInfoState): NetworkStatus {
  const isConnected = state.isConnected !== false
  // Treat null reachability while connected as online (matches auth resilience policy)
  const isInternetReachable =
    state.isInternetReachable === false ? false : isConnected

  return {
    isConnected,
    isInternetReachable,
    type: state.type ?? 'unknown',
  }
}

export class NetInfoNetworkProvider implements NetworkProvider {
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    void NetInfo.fetch()
      .then((state) => {
        listener(mapNetInfoState(state))
      })
      .catch(() => {})

    return NetInfo.addEventListener((state) => {
      listener(mapNetInfoState(state))
    })
  }

  async getStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch()
    return mapNetInfoState(state)
  }
}
