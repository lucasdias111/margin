import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type { CallResponsePayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'

class CallService {
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null

  startCall(
    callId: number,
    callerId: number,
    incomingCall: boolean,
    offer?: RTCSessionDescriptionInit
  ): void {
    callState.startP2PCall(callId, callerId, incomingCall, offer)
  }

  endCall(remoteConnectionEnded: boolean): void {
    this.cleanupConnection()

    if (!remoteConnectionEnded && callState.isP2PCall) {
      webSocketService.send({
        type: WebSocketMessageType.CALL_END,
        recipientId: callState.p2pCallState!.userId,
        payload: {
          callId: callState.callId!,
          callDuration: callState.duration
        }
      })
    }

    callState.endCall()
  }

  private async getUserMedia(includeVideo: boolean): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: includeVideo
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'NotFoundError') {
        alert(
          "Audio/video device not found. You can still receive the call, but the other person won't hear/see you."
        )
      } else {
        alert('Could not access media devices. You can still receive the call.')
      }

      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const dst = audioContext.createMediaStreamDestination()

      gainNode.gain.value = 0
      oscillator.connect(gainNode)
      gainNode.connect(dst)
      oscillator.start()

      return dst.stream
    }
  }

  private setupPeerConnection(localStream: MediaStream, userId: number): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream)
    })

    const remoteStream = new MediaStream()

    peerConnection.ontrack = (event) => {
      remoteStream.addTrack(event.track)
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream)
      }
      callState.setStatus('connected')
    }

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      webSocketService.send<RTCIceCandidate>({
        type: WebSocketMessageType.CALL_CANDIDATE,
        recipientId: userId,
        payload: event.candidate
      })
    }

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState

      if (state === 'connected') {
        this.startCallTimer()
        callState.setStatus('connected')
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.endCall(true)
      }
    }

    return peerConnection
  }

  private async processQueuedCandidates(): Promise<void> {
    if (!callState.isP2PCall) return

    const pc = callState.p2pCallState?.peerConnection
    if (!pc) return

    for (const candidate of callState.p2pCallState!.candidateQueue) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    callState.clearCandidateQueue()
  }

  private startCallTimer(): void {
    const intervalId = setInterval(() => {
      callState.incrementDuration()
    }, 1000) as unknown as number

    callState.setDurationInterval(intervalId)
  }

  private cleanupConnection(): void {
    if (!callState.isP2PCall || !callState.p2pCallState) return

    callState.p2pCallState.peerConnection?.close()
    callState.p2pCallState.localStream?.getTracks().forEach((track) => track.stop())
  }

  async initiateCall(userId: number): Promise<void> {
    const localStream = await this.getUserMedia(callState.p2pCallState?.isVideoEnabled ?? false)
    const peerConnection = this.setupPeerConnection(localStream, userId)
    const remoteStream = new MediaStream()

    callState.setConnection(peerConnection, localStream, remoteStream)

    if (this.onLocalStreamCallback) {
      this.onLocalStreamCallback(localStream)
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer

    const localStream = await this.getUserMedia(callState.p2pCallState?.isVideoEnabled ?? false)
    const peerConnection = this.setupPeerConnection(localStream, userId)
    const remoteStream = new MediaStream()

    callState.setConnection(peerConnection, localStream, remoteStream)

    if (this.onLocalStreamCallback) {
      this.onLocalStreamCallback(localStream)
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedOffer))
    await this.processQueuedCandidates()

    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    webSocketService.send<CallResponsePayload>({
      type: WebSocketMessageType.CALL_RESPONSE,
      recipientId: userId,
      payload: {
        callId: callState.callId!,
        callerId: userId,
        response: answer
      }
    })
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) return

    const response = data.payload.response
    const parsedAnswer = typeof response === 'string' ? JSON.parse(response) : response

    await callState.p2pCallState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(parsedAnswer)
    )
    await this.processQueuedCandidates()
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit | string): Promise<void> {
    if (!callState.isP2PCall) return

    const parsedCandidate = typeof candidate === 'string' ? JSON.parse(candidate) : candidate

    if (!callState.p2pCallState?.peerConnection) {
      callState.queueCandidate(parsedCandidate)
      return
    }

    if (callState.p2pCallState.peerConnection.remoteDescription) {
      await callState.p2pCallState.peerConnection.addIceCandidate(
        new RTCIceCandidate(parsedCandidate)
      )
    } else {
      callState.queueCandidate(parsedCandidate)
    }
  }

  async toggleVideo(): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.localStream) return

    const videoTrack = callState.p2pCallState.localStream.getVideoTracks()[0]

    if (callState.p2pCallState.isVideoEnabled && videoTrack) {
      videoTrack.stop()
      callState.setVideoEnabled(false)
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newVideoTrack = videoStream.getVideoTracks()[0]

        callState.p2pCallState.localStream.addTrack(newVideoTrack)

        if (callState.p2pCallState.peerConnection) {
          const sender = callState.p2pCallState.peerConnection
            .getSenders()
            .find((s) => s.track?.kind === 'video')

          if (sender) {
            await sender.replaceTrack(newVideoTrack)
          } else {
            callState.p2pCallState.peerConnection.addTrack(
              newVideoTrack,
              callState.p2pCallState.localStream
            )
          }
        }

        callState.setVideoEnabled(true)

        if (this.onLocalStreamCallback) {
          this.onLocalStreamCallback(callState.p2pCallState.localStream)
        }
      } catch (err) {
        console.error('Error enabling video:', err)
        alert('Camera not available. Please check your camera permissions or connect a camera.')
      }
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  onLocalStream(callback: (stream: MediaStream) => void): void {
    this.onLocalStreamCallback = callback
  }

  cleanup(): void {
    this.cleanupConnection()
    this.onRemoteStreamCallback = null
    this.onLocalStreamCallback = null
  }
}

export const callService = new CallService()
