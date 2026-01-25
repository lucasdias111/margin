export type CallStatus = 'connecting' | 'connected' | 'ended'

interface CallStateData {
  activeCall: {
    userId: number
    isIncoming: boolean
    offer?: RTCSessionDescriptionInit
  } | null
  status: CallStatus
  duration: number
  callId: number | null
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  candidateQueue: RTCIceCandidateInit[]
  durationInterval: number | null
}

function createCallState() {
  let state = $state<CallStateData>({
    activeCall: null,
    status: 'connecting',
    duration: 0,
    callId: null,
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    candidateQueue: [],
    durationInterval: null
  })

  return {
    get activeCall() {
      return state.activeCall
    },
    get status(): CallStatus {
      return state.status
    },
    get duration(): number {
      return state.duration
    },
    get callId(): number {
      return state.callId
    },
    get peerConnection(): RTCPeerConnection | null {
      return state.peerConnection
    },
    get localStream(): MediaStream | null {
      return state.localStream
    },
    get remoteStream(): MediaStream | null {
      return state.remoteStream
    },
    get candidateQueue(): RTCIceCandidateInit[] {
      return state.candidateQueue
    },
    get durationInterval(): number | null {
      return state.durationInterval
    },

    startCall(
      callId: number,
      user: number,
      isIncoming: boolean = false,
      offer?: RTCSessionDescriptionInit
    ): void {
      state.callId = callId
      state.activeCall = { userId: user, isIncoming, offer }
      state.status = 'connecting'
      state.duration = 0
    },

    setStatus(status: CallStatus): void {
      state.status = status
    },

    incrementDuration(): void {
      state.duration++
    },

    setConnection(
      peerConnection: RTCPeerConnection,
      localStream: MediaStream,
      remoteStream: MediaStream
    ): void {
      state.peerConnection = peerConnection
      state.localStream = localStream
      state.remoteStream = remoteStream
    },

    queueCandidate(candidate: RTCIceCandidateInit): void {
      state.candidateQueue = [...state.candidateQueue, candidate]
    },

    clearCandidateQueue(): void {
      state.candidateQueue = []
    },

    setDurationInterval(intervalId: number): void {
      state.durationInterval = intervalId
    },

    setCallId(callId: number): void {
      state.callId = callId
    },

    endCall(): void {
      state.activeCall = null
      state.status = 'ended'
      state.duration = 0
      state.peerConnection = null
      state.localStream = null
      state.remoteStream = null
      state.candidateQueue = []
      state.durationInterval = null
    },

    reset(): void {
      state.activeCall = null
      state.status = 'connecting'
      state.duration = 0
      state.callId = null
      state.peerConnection = null
      state.localStream = null
      state.remoteStream = null
      state.candidateQueue = []
      state.durationInterval = null
    }
  }
}

export const callState = createCallState()
