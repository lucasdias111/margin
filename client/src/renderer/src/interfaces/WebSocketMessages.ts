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
  callerId: number
  sdp: string
  callType: 'AUDIO' | 'VIDEO'
}

export interface CallResponsePayload {
  callId: number
  callerId: number
  response: RTCSessionDescriptionInit
}

export interface CallAnswerPayload {
  callId: number
  action: 'ACCEPT' | 'REJECT'
  sdp?: string
  type?: string
}

export interface CallEndPayload {
  callId: number
  callDuration: number
}

export interface CallCandidatePayload {
  callId: number
  candidate: string
  sdpMid: string | null
  sdpMLineIndex: number | null
  usernameFragment: string
}
