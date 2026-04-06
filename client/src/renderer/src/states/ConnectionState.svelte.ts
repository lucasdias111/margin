export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

class ConnectionState {
  connectionStatus: ConnectionStatus = $state('disconnected')
}

export const connectionState = new ConnectionState()
