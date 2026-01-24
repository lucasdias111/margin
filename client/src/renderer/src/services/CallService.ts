import { callState } from '$src/states/CallState.svelte'

class CallService {
  startCall(
    callId: number,
    callerId: number,
    incomingCall: boolean,
    offer?: RTCSessionDescriptionInit
  ): void {
    callState.startCall(callId, callerId, incomingCall, offer)
  }

  endCall(): void {
    callState.endCall()
  }
}

export const callService = new CallService()
