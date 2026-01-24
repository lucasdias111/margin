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
}

function createCallState() {
  let state = $state<CallStateData>({
    activeCall: null,
    status: 'connecting',
    duration: 0,
    callId: null,
  })

  return {
    get activeCall(): { userId: number; isIncoming: boolean; offer?: RTCSessionDescriptionInit } {
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

    endCall() {
      state.activeCall = null
      state.status = 'ended'
      state.duration = 0
    }
  }
}

export const callState = createCallState()
