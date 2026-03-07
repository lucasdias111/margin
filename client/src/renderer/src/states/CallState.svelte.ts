import type {
  BaseCallState,
  CallStatus,
  ChannelCallSession,
  GroupCallData,
  P2PCallData
} from '$src/interfaces/Calls'
import type { User } from '$src/interfaces/User'

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
      isVideoEnabled: false,
      isRemoteVideoEnabled: false,
      isScreenSharing: false,
      isRemoteScreenSharing: false,
      screenShareTrack: null
    }
  }

  startGroupCall(callId: number, channelId: number): void {
    this.activeCallType = 'group'
    this.baseState.callId = callId
    this.baseState.status = 'connecting'
    this.baseState.duration = 0

    this.groupData = {
      channelId,
      session: null
    }
  }

  setGroupSession(session: ChannelCallSession): void {
    if (!this.isGroupCall || !this.groupData) return
    this.groupData.session = session
  }

  setStatus(status: CallStatus): void {
    this.baseState.status = status
  }
  incrementDuration(): void {
    this.baseState.duration++
  }
  setDurationInterval(intervalId: number): void {
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

  setVideoEnabled(enabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isVideoEnabled = enabled
  }

  setRemoteVideoEnabled(enabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isRemoteVideoEnabled = enabled
  }

  // screenShareStream removed — the transceiver sender owns the track lifecycle
  setScreenSharing(enabled: boolean, track: MediaStreamTrack | null = null): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isScreenSharing = enabled
    this.p2pData.screenShareTrack = track
  }

  setRemoteScreenSharing(enabled: boolean): void {
    if (!this.isP2PCall || !this.p2pData) return
    this.p2pData.isRemoteScreenSharing = enabled
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
}

export const callState = new CallState()
