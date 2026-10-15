import { API_CONFIG } from '$src/shared/config'
import { getGuestToken } from '$src/services/meetingApi'

export type LobbySignal = 'admitted' | 'denied' | 'removed'

class MeetingLobbySocket {
  private socket: WebSocket | null = null

  connect(onSignal: (signal: LobbySignal) => void): void {
    const token = getGuestToken()
    if (!token || this.socket) return

    this.socket = new WebSocket(`${API_CONFIG.wsUrl}?token=${encodeURIComponent(token)}`)

    this.socket.onopen = () => this.knock()

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'MEETING_ADMITTED') onSignal('admitted')
      else if (message.type === 'MEETING_DENIED') onSignal('denied')
      else if (message.type === 'MEETING_REMOVED') onSignal('removed')
    }
  }

  knock(): void {
    this.send('MEETING_KNOCK')
  }

  disconnect(): void {
    if (!this.socket) return
    if (this.socket.readyState === WebSocket.OPEN) this.send('MEETING_LEAVE_LOBBY')
    this.socket.close()
    this.socket = null
  }

  private send(type: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return
    this.socket.send(JSON.stringify({ type, recipientId: 0, payload: null }))
  }
}

export const meetingLobbySocket = new MeetingLobbySocket()
