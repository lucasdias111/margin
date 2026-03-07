import type { User } from '$src/interfaces/User'

export interface WebSocketMessage<T> {
  type: string
  timestamp: number
  recipientId?: number
  payload?: T
}

export interface WebSocketMessageOut<T> {
  type: string
  recipientId?: number
  payload?: T
}

export interface CallOfferPayload {
  callId: number
  caller: User
  sdp: string
  callType: 'AUDIO' | 'VIDEO'
}

export interface CallResponsePayload {
  callId: number
  callerId: number
  response: RTCSessionDescriptionInit
}

export interface CallCandidatePayload {
  callId: number
  candidate: string
  sdpMid: string | null
  sdpMLineIndex: number | null
  usernameFragment: string
}
