import type {
  BaseCallState,
  CallStatus,
  ChannelCallSession,
  GroupCallData,
  P2PCallData
} from '$src/interfaces/Calls'

type CallType = 'p2p' | 'group'

class CallState {
  private baseState = $state<BaseCallState>({
    callId: null,
    status: 'connecting',
    duration: 0,
    durationInterval: null
  })

  private activeCallType = $state<CallType | null>(null)

  private p2pData = $state<P2PCallData | null>(null)
  private groupData = $state<GroupCallData | null>(null)

  get callType(): CallType | null {
    return this.activeCallType
  }

  get isActive(): boolean {
    return this.activeCallType !== null
  }

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
    userId: number,
    isIncoming: boolean = false,
    offer?: RTCSessionDescriptionInit
  ): void {
    this.activeCallType = 'p2p'
    this.baseState.callId = callId
    this.baseState.status = 'connecting'
    this.baseState.duration = 0

    this.p2pData = {
      userId,
      isIncoming,
      offer,
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      candidateQueue: [],
      isVideoEnabled: false
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
  }
}

export const callState = new CallState()
