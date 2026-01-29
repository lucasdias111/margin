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
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null

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

    const constraints = {
      audio: true,
      video: callState.isVideoEnabled
    }

    let localStream: MediaStream

    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Got media stream:', localStream.getTracks())
    } catch (err) {
      console.warn('Failed to get media devices:', err)

      // Show warning to user
      if (err instanceof Error && err.name === 'NotFoundError') {
        alert(
          "Audio/video device not found. You can still receive the call, but the other person won't hear/see you."
        )
      } else {
        alert('Could not access media devices. You can still receive the call.')
      }

      // Create a truly silent audio track so WebRTC can establish connection
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const dst = audioContext.createMediaStreamDestination()

      // Set gain to 0 to make it silent
      gainNode.gain.value = 0

      oscillator.connect(gainNode)
      gainNode.connect(dst)
      oscillator.start()

      localStream = dst.stream
      console.log('Created silent audio stream as fallback')
    }

    const peerConnection = new RTCPeerConnection(config)
    const remoteStream = new MediaStream()

    localStream.getTracks().forEach((track) => {
      console.log('Adding track to peer connection:', track.kind)
      peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind)
      remoteStream.addTrack(event.track)
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream)
      }
      callState.setStatus('connected')
    }

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate.candidate)
        if (callState.activeCall?.userId) {
          webSocketService.send<RTCIceCandidate>({
            type: WebSocketMessageType.CALL_CANDIDATE,
            recipientId: callState.activeCall.userId,
            payload: event.candidate
          })
        }
      } else {
        console.log('All ICE candidates sent')
      }
    }

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState)
    }

    peerConnection.onconnectionstatechange = () => {
      const connectionState = peerConnection.connectionState
      console.log('Connection state:', connectionState)

      if (connectionState === 'connected') {
        this.startCallTimer()
        callState.setStatus('connected')
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

    if (this.onLocalStreamCallback) {
      this.onLocalStreamCallback(connectionObjects.localStream)
    }

    const offer: RTCSessionDescriptionInit = await callState.peerConnection!.createOffer()
    await callState.peerConnection!.setLocalDescription(offer)
    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    console.log('Answering call from user:', userId)
    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer
    console.log('Parsed offer:', parsedOffer)

    const connectionObjects = await this.setupConnectionObjects()
    callState.setConnection(
      connectionObjects.peerConnection,
      connectionObjects.localStream,
      connectionObjects.remoteStream
    )

    if (this.onLocalStreamCallback) {
      this.onLocalStreamCallback(connectionObjects.localStream)
    }

    console.log('Setting remote description...')
    await callState.peerConnection!.setRemoteDescription(new RTCSessionDescription(parsedOffer))
    console.log('Remote description set')

    await this.processQueuedCandidates()

    console.log('Creating answer...')
    const answer = await callState.peerConnection!.createAnswer()
    console.log('Answer created:', answer)

    await callState.peerConnection!.setLocalDescription(answer)
    console.log('Local description set')

    const response: CallResponsePayload = {
      callId: callState.callId,
      callerId: userId,
      response: answer
    }

    console.log('Sending answer to recipient:', userId)
    webSocketService.send<CallResponsePayload>({
      type: WebSocketMessageType.CALL_RESPONSE,
      recipientId: userId,
      payload: response
    })
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    if (!callState.peerConnection) {
      return
    }

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

  async toggleVideo(): Promise<void> {
    if (!callState.localStream) return

    const videoTrack = callState.localStream.getVideoTracks()[0]

    if (callState.isVideoEnabled && videoTrack) {
      videoTrack.stop()
      callState.setVideoEnabled(false)
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newVideoTrack = videoStream.getVideoTracks()[0]

        callState.localStream.addTrack(newVideoTrack)

        if (callState.peerConnection) {
          const sender = callState.peerConnection
            .getSenders()
            .find((s) => s.track?.kind === 'video')

          if (sender) {
            await sender.replaceTrack(newVideoTrack)
          } else {
            callState.peerConnection.addTrack(newVideoTrack, callState.localStream)
          }
        }

        callState.setVideoEnabled(true)

        if (this.onLocalStreamCallback) {
          this.onLocalStreamCallback(callState.localStream)
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
