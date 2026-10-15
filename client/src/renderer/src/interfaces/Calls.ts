import { Device } from 'mediasoup-client'
import type { RtpCapabilities, Transport, Producer } from 'mediasoup-client/types'
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
  isAudioEnabled: boolean
  isRemoteAudioEnabled: boolean
  isVideoEnabled: boolean
  isRemoteVideoEnabled: boolean
  isScreenSharing: boolean
  isRemoteScreenSharing: boolean
  screenShareTrack: MediaStreamTrack | null
  remoteScreenStream: MediaStream | null
}

export interface GroupCallData {
  roomId: string
  channelId: number | null
  meetingCode: string | null
  title: string | null
  localPeerId: string | null
  session: ChannelCallSession | null
  participants: SFUParticipant[]
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  screenShareProducer: Producer | null
  isScreenSharing: boolean
}

export interface ChannelCallSession {
  sfuWebsocket: WebSocket | null
  rtpCapabilities: RtpCapabilities
  device: Device
  sendTransport: Transport
  receiveTransport: Transport
  localStream: MediaStream
  audioProducer: Producer | null
  videoProducer: Producer | null
  preferredVideoHeight: number | null
  preferredScreenHeight: number | null
}

export interface CallParticipant {
  id: number
  displayName: string
  profilePictureUrl: string | null
  stream: MediaStream | null
  isVideoEnabled: boolean
  isScreenSharing: boolean
  isLocal: boolean
}

export interface SFUParticipant {
  peerId: string
  displayName: string
  profilePictureUrl: string | null
  audioStream: MediaStream | null
  videoStream: MediaStream | null
  screenStream: MediaStream | null
  isVideoEnabled: boolean
  isScreenSharing: boolean
}
