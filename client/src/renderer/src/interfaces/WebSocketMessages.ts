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

export interface ChannelVoiceParticipantPayload {
  channelId: number
  user: User
}

export interface ChannelCallInvitePayload {
  channelId: number
  channelName: string
  fromUser: User
}

export interface TypingIndicatorPayload {
  isTyping: boolean
}

export interface TypingIndicatorEventPayload {
  userId: number
  displayName: string
  isTyping: boolean
}

export interface MeetingInvitePayload {
  code: string
  title: string | null
  marginName: string
  inviter: User
}
