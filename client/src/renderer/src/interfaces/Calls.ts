import { Device } from 'mediasoup-client'
import type { RtpCapabilities, Transport } from 'mediasoup-client/types'
import type { User } from '$src/interfaces/User'

export type CallStatus = 'connecting' | 'connected' | 'ended'

export interface BaseCallState {
  callId: number | null
  status: CallStatus
  duration: number
  durationInterval: number | null
  isMinimized: boolean
}

export interface P2PCallData {
  user: User
  isIncoming: boolean
  offer?: RTCSessionDescriptionInit
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  candidateQueue: RTCIceCandidateInit[]
  isVideoEnabled: boolean
  isRemoteVideoEnabled: boolean
  isScreenSharing: boolean
  isRemoteScreenSharing: boolean
  screenShareTrack: MediaStreamTrack | null
}

export interface GroupCallData {
  channelId: number
  session: ChannelCallSession | null
}

export interface ChannelCallSession {
  sfuWebsocket: WebSocket | null
  rtpCapabilities: RtpCapabilities
  device: Device
  sendTransport: Transport
  receiveTransport: Transport
  localStream: MediaStream
}
