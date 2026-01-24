import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type { CallEndPayload, CallResponsePayload } from '$src/interfaces/WebSocketMessages'

interface ConnectionState {
  peerConnection: RTCPeerConnection | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  candidateQueue: RTCIceCandidateInit[]
  remoteUserId: number | null
  durationInterval: number | null
}

class WebRTCService {
  private state: ConnectionState
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null

  constructor() {
    this.state = this.createEmptyState()
  }

  private createEmptyState(): ConnectionState {
    return {
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      candidateQueue: [],
      remoteUserId: null,
      durationInterval: null
    }
  }

  private withRemoteUserId(userId: number): void {
    this.state = { ...this.state, remoteUserId: userId }
  }

  private withCandidateQueued(candidate: RTCIceCandidateInit): void {
    this.state = {
      ...this.state,
      candidateQueue: [...this.state.candidateQueue, candidate]
    }
  }

  private withClearedQueue(): void {
    this.state = { ...this.state, candidateQueue: [] }
  }

  private withTimer(intervalId: number): void {
    this.state = { ...this.state, durationInterval: intervalId }
  }

  private withConnection(
    peerConnection: RTCPeerConnection,
    localStream: MediaStream,
    remoteStream: MediaStream
  ): void {
    this.state = {
      ...this.state,
      peerConnection,
      localStream,
      remoteStream
    }
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
      if (event.candidate && this.state.remoteUserId) {
        webSocketService.send<RTCIceCandidate>({
          type: WebSocketMessageType.CALL_CANDIDATE,
          recipientId: this.state.remoteUserId,
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
        this.endCall()
      }
    }

    return { peerConnection, localStream, remoteStream }
  }

  private async processQueuedCandidates(): Promise<void> {
    if (!this.state.peerConnection) return

    for (const candidate of this.state.candidateQueue) {
      await this.state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }

    this.withClearedQueue()
  }

  private startCallTimer(): void {
    if (this.state.durationInterval) return // Already started

    const intervalId = setInterval(() => {
      callState.incrementDuration()
    }, 1000) as unknown as number

    this.withTimer(intervalId)
  }

  private stopCallTimer(): void {
    if (this.state.durationInterval) {
      clearInterval(this.state.durationInterval)
    }
  }

  private cleanupConnection(): void {
    this.stopCallTimer()

    if (this.state.peerConnection) {
      this.state.peerConnection.close()
    }

    if (this.state.localStream) {
      this.state.localStream.getTracks().forEach((track) => track.stop())
    }
  }

  async initiateCall(userId: number): Promise<void> {
    this.withRemoteUserId(userId)

    const connectionObjects = await this.setupConnectionObjects()
    this.withConnection(
      connectionObjects.peerConnection,
      connectionObjects.localStream,
      connectionObjects.remoteStream
    )

    const offer: RTCSessionDescriptionInit = await this.state.peerConnection!.createOffer()
    await this.state.peerConnection!.setLocalDescription(offer)

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    this.withRemoteUserId(userId)

    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer

    const connectionObjects = await this.setupConnectionObjects()
    this.withConnection(
      connectionObjects.peerConnection,
      connectionObjects.localStream,
      connectionObjects.remoteStream
    )

    await this.state.peerConnection!.setRemoteDescription(new RTCSessionDescription(parsedOffer))
    await this.processQueuedCandidates()

    const answer = await this.state.peerConnection!.createAnswer()
    await this.state.peerConnection!.setLocalDescription(answer)

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

  async handleCallResponse(answer: RTCSessionDescriptionInit | string): Promise<void> {
    if (!this.state.peerConnection) return

    const parsedAnswer = typeof answer === 'string' ? JSON.parse(answer) : answer

    await this.state.peerConnection.setRemoteDescription(new RTCSessionDescription(parsedAnswer))
    await this.processQueuedCandidates()
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit | string): Promise<void> {
    const parsedCandidate = typeof candidate === 'string' ? JSON.parse(candidate) : candidate

    if (!this.state.peerConnection) {
      this.withCandidateQueued(parsedCandidate)
      return
    }

    if (this.state.peerConnection.remoteDescription) {
      await this.state.peerConnection.addIceCandidate(new RTCIceCandidate(parsedCandidate))
    } else {
      this.withCandidateQueued(parsedCandidate)
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  endCall(): void {
    this.cleanupConnection()

    const callEndPayload: CallEndPayload = {
      callId: callState.callId,
      callDuration: callState.duration
    }

    if (this.state.remoteUserId) {
      webSocketService.send({
        type: WebSocketMessageType.CALL_END,
        recipientId: this.state.remoteUserId,
        payload: callEndPayload
      })
    }

    callState.endCall()
    this.state = this.createEmptyState()
  }

  cleanup(): void {
    this.cleanupConnection()
    this.onRemoteStreamCallback = null
    this.state = this.createEmptyState()
  }
}

export const webrtcService = new WebRTCService()
