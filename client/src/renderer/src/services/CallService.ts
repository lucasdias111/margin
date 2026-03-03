import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type {
  CallCandidatePayload,
  CallResponsePayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'

class CallService {
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null
  private onRemoteScreenShareCallback: ((stream: MediaStream | null) => void) | null = null
  private isNegotiating = false
  private isReceivingScreenShare = false

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
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: includeVideo })
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
      const track = event.track

      if (track.kind === 'audio') {
        remoteStream.addTrack(track)
        if (this.onRemoteStreamCallback) this.onRemoteStreamCallback(remoteStream)
        callState.setStatus('connected')
        return
      }

      if (track.kind === 'video') {
        if (this.isReceivingScreenShare) {
          this.isReceivingScreenShare = false
          const screenStream = new MediaStream([track])
          if (this.onRemoteScreenShareCallback) this.onRemoteScreenShareCallback(screenStream)
          callState.setRemoteScreenSharing(true)

          track.onended = () => {
            if (this.onRemoteScreenShareCallback) this.onRemoteScreenShareCallback(null)
            callState.setRemoteScreenSharing(false)
          }
        } else {
          remoteStream.addTrack(track)
          if (this.onRemoteStreamCallback) this.onRemoteStreamCallback(remoteStream)
          callState.setStatus('connected')
        }
      }
    }

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (!event.candidate) return
      webSocketService.send<RTCIceCandidate>({
        type: WebSocketMessageType.CALL_CANDIDATE,
        recipientId: userId,
        payload: event.candidate
      })
    }

    let negotiationQueue = Promise.resolve()

    peerConnection.onnegotiationneeded = async () => {
      negotiationQueue = negotiationQueue.then(async () => {
        if (this.isNegotiating) return
        this.isNegotiating = true
        try {
          const pc = callState.p2pCallState?.peerConnection
          if (!pc || !callState.p2pCallState) return
          if (pc.signalingState !== 'stable') return

          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          webSocketService.send<RTCSessionDescriptionInit>({
            type: WebSocketMessageType.SCREEN_SHARE_OFFER,
            recipientId: callState.p2pCallState.userId,
            payload: offer
          })
        } catch (err) {
          console.error('Renegotiation failed:', err)
        } finally {
          this.isNegotiating = false
        }
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
    this.isNegotiating = false
    this.isReceivingScreenShare = false
    callState.p2pCallState.peerConnection?.close()
    callState.p2pCallState.localStream?.getTracks().forEach((track) => track.stop())
    callState.p2pCallState.screenShareTrack?.stop()
  }

  async initiateCall(userId: number): Promise<void> {
    this.isNegotiating = true
    const localStream = await this.getUserMedia(callState.p2pCallState?.isVideoEnabled ?? false)
    const peerConnection = this.setupPeerConnection(localStream, userId)
    const remoteStream = new MediaStream()

    callState.setConnection(peerConnection, localStream, remoteStream)

    if (this.onLocalStreamCallback) this.onLocalStreamCallback(localStream)

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
    this.isNegotiating = false
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    this.isNegotiating = true
    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer
    const localStream = await this.getUserMedia(callState.p2pCallState?.isVideoEnabled ?? false)
    const peerConnection = this.setupPeerConnection(localStream, userId)
    const remoteStream = new MediaStream()

    callState.setConnection(peerConnection, localStream, remoteStream)

    if (this.onLocalStreamCallback) this.onLocalStreamCallback(localStream)

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
    this.isNegotiating = false
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

  async handleScreenShareOffer(data: WebSocketMessage<RTCSessionDescriptionInit>): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) return

    this.isReceivingScreenShare = true
    const pc = callState.p2pCallState.peerConnection
    const parsedOffer = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload

    await pc.setRemoteDescription(new RTCSessionDescription(parsedOffer))

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await this.processQueuedCandidates()

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.SCREEN_SHARE_ANSWER,
      recipientId: callState.p2pCallState.userId,
      payload: answer
    })
  }

  async handleScreenShareAnswer(data: WebSocketMessage<RTCSessionDescriptionInit>): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) return

    const parsedAnswer = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload
    await callState.p2pCallState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(parsedAnswer)
    )
    await this.processQueuedCandidates()
  }

  async handleIceCandidate(data: WebSocketMessage<CallCandidatePayload>): Promise<void> {
    if (!data.payload) return
    const { candidate, sdpMid, sdpMLineIndex, usernameFragment } = data.payload
    if (!callState.isP2PCall) return

    const rtcCandidate = new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })

    if (!callState.p2pCallState?.peerConnection) {
      callState.queueCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })
      return
    }

    if (callState.p2pCallState.peerConnection.remoteDescription) {
      await callState.p2pCallState.peerConnection.addIceCandidate(rtcCandidate)
    } else {
      callState.queueCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })
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
        if (this.onLocalStreamCallback)
          this.onLocalStreamCallback(callState.p2pCallState.localStream)
      } catch (err) {
        console.error('Error enabling video:', err)
        alert('Camera not available. Please check your camera permissions or connect a camera.')
      }
    }
  }

  async startScreenShare(): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) return
    if (callState.p2pCallState.isScreenSharing || callState.p2pCallState.isRemoteScreenSharing)
      return

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      const screenTrack = screenStream.getVideoTracks()[0]

      callState.p2pCallState.peerConnection.addTrack(screenTrack, screenStream)
      callState.setScreenSharing(true, screenTrack, screenStream)

      webSocketService.send<string>({
        type: WebSocketMessageType.SCREEN_SHARE_STARTED,
        recipientId: callState.p2pCallState.userId,
        payload: ''
      })

      screenTrack.onended = () => {
        this.stopScreenShare()
      }
    } catch (err) {
      console.error('Error starting screen share:', err)
    }
  }

  async stopScreenShare(): Promise<void> {
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) return
    if (!callState.p2pCallState.isScreenSharing) return

    const { screenShareTrack, peerConnection, userId } = callState.p2pCallState

    if (screenShareTrack) {
      screenShareTrack.stop()
      const sender = peerConnection.getSenders().find((s) => s.track === screenShareTrack)
      if (sender) peerConnection.removeTrack(sender)
    }

    callState.setScreenSharing(false, null, null)

    webSocketService.send<string>({
      type: WebSocketMessageType.SCREEN_SHARE_STOPPED,
      recipientId: userId,
      payload: ''
    })
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback
  }

  onLocalStream(callback: (stream: MediaStream) => void): void {
    this.onLocalStreamCallback = callback
  }

  onRemoteScreenShare(callback: (stream: MediaStream | null) => void): void {
    this.onRemoteScreenShareCallback = callback
  }

  cleanup(): void {
    this.cleanupConnection()
    this.onRemoteStreamCallback = null
    this.onLocalStreamCallback = null
    this.onRemoteScreenShareCallback = null
  }
}

export const callService = new CallService()
