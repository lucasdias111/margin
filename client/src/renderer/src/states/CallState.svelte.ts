import type {
  BaseCallState,
  CallStatus,
  ChannelCallSession,
  GroupCallData,
  P2PCallData,
  SFUParticipant
} from '$src/interfaces/Calls'
import type { User } from '$src/interfaces/User'
import type { Producer } from 'mediasoup-client/types'

type CallType = 'p2p' | 'group'

class CallState {
  private baseState = $state<BaseCallState>({
    callId: null,
    status: 'connecting',
    duration: 0,
    durationInterval: null,
    isMinimized: false
  })

  private activeCallType = $state<CallType | null>(null)
  private p2pData = $state<P2PCallData | null>(null)
  private groupData = $state<GroupCallData | null>(null)

  get isP2PCall(): boolean {
    return this.activeCallType === 'p2p'
  }
  get isGroupCall(): boolean {
    return this.activeCallType === 'group'
  }
  get callId(): number | null {
    return this.baseState.callId
  }
  get status(): CallStatus {
    return this.baseState.status
  }
  get duration(): number {
    return this.baseState.duration
  }
  get p2pCallState(): P2PCallData | null {
    return this.isP2PCall ? this.p2pData : null
  }
  get groupCallState(): GroupCallData | null {
    return this.isGroupCall ? this.groupData : null
  }

  startP2PCall(
    callId: number,
    user: User,
    isIncoming: boolean = false,
    offer?: RTCSessionDescriptionInit
  ): void {
    this.activeCallType = 'p2p'
    this.baseState.callId = callId
    this.baseState.status = 'connecting'
    this.baseState.duration = 0

    this.p2pData = {
      user: user,
      isIncoming,
      offer,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      candidateQueue: [],
      isAudioEnabled: true,
      isRemoteAudioEnabled: false,
      isVideoEnabled: false,
      isRemoteVideoEnabled: false,
      isScreenSharing: false,
      isRemoteScreenSharing: false,
      screenShareTrack: null,
      remoteScreenStream: null
    }
  }

  startGroupCall(callId: number, channelId: number): void {
    this.activeCallType = 'group'
    this.baseState.callId = callId
    this.baseState.status = 'connecting'
    this.baseState.duration = 0
    this.baseState.isMinimized = false

    this.groupData = {
      roomId: String(channelId),
      channelId,
      meetingCode: null,
      title: null,
      localPeerId: null,
      session: null,
      participants: [],
      isVideoEnabled: false,
      isAudioEnabled: true,
      screenShareProducer: null,
      isScreenSharing: false
    }
  }

  startMeetingCall(
    meetingCode: string,
    roomId: string,
    title: string | null,
    localPeerId: string
  ): void {
    this.activeCallType = 'group'
    this.baseState.callId = null
    this.baseState.status = 'connecting'
    this.baseState.duration = 0
    this.baseState.isMinimized = false

    this.groupData = {
      roomId,
      channelId: null,
      meetingCode,
      title,
      localPeerId,
      session: null,
      participants: [],
      isVideoEnabled: false,
      isAudioEnabled: true,
      screenShareProducer: null,
      isScreenSharing: false
    }
  }

  setGroupSession(session: ChannelCallSession): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.session = session
  }

  setGroupAudioEnabled(enabled: boolean): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.isAudioEnabled = enabled
  }

  setGroupVideoEnabled(enabled: boolean): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.isVideoEnabled = enabled
  }

  setGroupVideoProducer(producer: Producer | null): void {
    if (!this.isGroupCall || !this.groupData?.session) return
    this.groupData.session.videoProducer = producer
  }

  setGroupVideoQuality(height: number | null): void {
    if (!this.isGroupCall || !this.groupData?.session) return
    this.groupData.session.preferredVideoHeight = height
  }

  setGroupScreenShareQuality(height: number | null): void {
    if (!this.isGroupCall || !this.groupData?.session) return
    this.groupData.session.preferredScreenHeight = height
  }

  setGroupScreenShareProducer(producer: Producer | null): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.screenShareProducer = producer
  }

  setGroupScreenSharing(enabled: boolean): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.isScreenSharing = enabled
  }

  setStatus(status: CallStatus): void {
    this.baseState.status = status
  }
  incrementDuration(): void {
    this.baseState.duration++
  }
  setDurationInterval(intervalId: number): void {
    if (this.baseState.durationInterval) {
      clearInterval(this.baseState.durationInterval)
    }
    this.baseState.durationInterval = intervalId
  }
  setCallId(callId: number): void {
    this.baseState.callId = callId
  }

  setConnection(
    peerConnection: RTCPeerConnection,
    localStream: MediaStream,
    remoteStream: MediaStream
  ): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.peerConnection = peerConnection
    this.p2pData.localStream = localStream
    this.p2pData.remoteStream = remoteStream
  }

  queueCandidate(candidate: RTCIceCandidateInit): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.candidateQueue = [...this.p2pData.candidateQueue, candidate]
  }

  clearCandidateQueue(): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.candidateQueue = []
  }

  setAudioEnabled(isAudioEnabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isAudioEnabled = isAudioEnabled
  }

  setRemoteAudioEnabled(isRemoteAudioEnabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isRemoteAudioEnabled = isRemoteAudioEnabled
  }

  setVideoEnabled(enabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isVideoEnabled = enabled
  }

  setRemoteVideoEnabled(enabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isRemoteVideoEnabled = enabled
  }

  setScreenSharing(enabled: boolean, track: MediaStreamTrack | null = null): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isScreenSharing = enabled
    this.p2pData.screenShareTrack = track
  }

  setRemoteScreenSharing(enabled: boolean, stream: MediaStream | null): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isRemoteScreenSharing = enabled
    this.p2pData.remoteScreenStream = stream
  }

  toggleMinimized(): void {
    this.baseState.isMinimized = !this.baseState.isMinimized
  }

  get isMinimized(): boolean {
    return this.baseState.isMinimized
  }

  endCall(): void {
    if (this.baseState.durationInterval) {
      clearInterval(this.baseState.durationInterval)
    }

    this.activeCallType = null
    this.baseState.callId = null
    this.baseState.status = 'ended'
    this.baseState.duration = 0
    this.baseState.durationInterval = null
    this.p2pData = null
    this.groupData = null
    this.baseState.isMinimized = false
  }

  addGroupParticipant(participant: SFUParticipant): void {
    if (!this.isGroupCall || !this.groupData) return
    const existing = this.groupData.participants.findIndex((p) => p.peerId === participant.peerId)
    if (existing >= 0) {
      this.groupData.participants[existing] = participant
    } else {
      this.groupData.participants = [...this.groupData.participants, participant]
    }
  }

  removeGroupParticipant(peerId: string): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.participants = this.groupData.participants.filter((p) => p.peerId !== peerId)
  }
}

export const callState = new CallState()
