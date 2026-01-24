import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type {
  CallEndPayload,
  CallResponsePayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'

class CallService {
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null

  startCall(
    callId: number,
    callerId: number,
    incomingCall: boolean,
    offer?: RTCSessionDescriptionInit
  ): void {
    callState.startCall(callId, callerId, incomingCall, offer)
  }

  endCall(remoteConnectionEnded: boolean): void {
    this.cleanupConnection()

    const callEndPayload: CallEndPayload = {
      callId: callState.callId,
      callDuration: callState.duration
    }

    console.log('call endCall', callEndPayload)

    if (!remoteConnectionEnded) {
      webSocketService.send({
        type: WebSocketMessageType.CALL_END,
        recipientId: callState.activeCall.userId,
        payload: callEndPayload
      })
    }

    callState.endCall()
  }

  private async setupConnectionObjects(): Promise<{
    peerConnection: RTCPeerConnection
    localStream: MediaStream
    remoteStream: MediaStream
  }> {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }

    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const peerConnection = new RTCPeerConnection(config)
    const remoteStream = new MediaStream()

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
      remoteStream.addTrack(event.track)
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream)
      }
      callState.setStatus('connected')
    }

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && callState.activeCall?.userId) {
        webSocketService.send<RTCIceCandidate>({
          type: WebSocketMessageType.CALL_CANDIDATE,
          recipientId: callState.activeCall.userId,
          payload: event.candidate
        })
      }
    }

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState
      if (connectionState === 'connected') {
        this.startCallTimer()
      } else if (
        connectionState === 'disconnected' ||
        connectionState === 'failed' ||
        connectionState === 'closed'
      ) {
        this.endCall(true)
      }
    }

    return { peerConnection, localStream, remoteStream }
  }

  private async processQueuedCandidates(): Promise<void> {
    const pc = callState.peerConnection
    if (!pc) return

    for (const candidate of callState.candidateQueue) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    callState.clearCandidateQueue()
  }

  private startCallTimer(): void {
    if (callState.durationInterval) return

    const intervalId = setInterval(() => {
      callState.incrementDuration()
    }, 1000) as unknown as number

    callState.setDurationInterval(intervalId)
  }

  private stopCallTimer(): void {
    if (callState.durationInterval) {
      clearInterval(callState.durationInterval)
    }
  }

  private cleanupConnection(): void {
    this.stopCallTimer()

    if (callState.peerConnection) {
      callState.peerConnection.close()
    }

    if (callState.localStream) {
      callState.localStream.getTracks().forEach((track) => track.stop())
    }
  }

  async initiateCall(userId: number): Promise<void> {
    const connectionObjects = await this.setupConnectionObjects()
    callState.setConnection(
      connectionObjects.peerConnection,
      connectionObjects.localStream,
      connectionObjects.remoteStream
    )

    const offer: RTCSessionDescriptionInit = await callState.peerConnection!.createOffer()
    await callState.peerConnection!.setLocalDescription(offer)

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer

    const connectionObjects = await this.setupConnectionObjects()
    callState.setConnection(
      connectionObjects.peerConnection,
      connectionObjects.localStream,
      connectionObjects.remoteStream
    )

    await callState.peerConnection!.setRemoteDescription(new RTCSessionDescription(parsedOffer))
    await this.processQueuedCandidates()

    const answer = await callState.peerConnection!.createAnswer()
    await callState.peerConnection!.setLocalDescription(answer)

    const response: CallResponsePayload = {
      callId: callState.callId,
      callerId: userId,
      response: answer
    }

    webSocketService.send<CallResponsePayload>({
      type: WebSocketMessageType.CALL_RESPONSE,
      recipientId: userId,
      payload: response
    })
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    if (!callState.peerConnection) return

    callState.setCallId(data.payload.callId)

    const response = data.payload.response
    const parsedAnswer = typeof response === 'string' ? JSON.parse(response) : response

    await callState.peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer))
    await this.processQueuedCandidates()
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit | string): Promise<void> {
    const parsedCandidate = typeof candidate === 'string' ? JSON.parse(candidate) : candidate

    if (!callState.peerConnection) {
      callState.queueCandidate(parsedCandidate)
      return
    }

    if (callState.peerConnection.remoteDescription) {
      await callState.peerConnection.addIceCandidate(new RTCIceCandidate(parsedCandidate))
    } else {
      callState.queueCandidate(parsedCandidate)
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  cleanup(): void {
    this.cleanupConnection()
    this.onRemoteStreamCallback = null
  }
}

export const callService = new CallService()
