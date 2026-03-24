import { callState } from '$src/states/CallState.svelte.js'
import { callSignalingService } from '$src/services/call/CallSignalingService'
import type { User } from '$src/interfaces/User'
import type { CallResponsePayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

class CallService {
  private noAnswerTimeout: ReturnType<typeof setTimeout> | null = null
  private screenTransceiver: RTCRtpTransceiver | null = null

  startCall(
    callId: number,
    caller: User,
    incomingCall: boolean,
    videoEnabled: boolean,
    offer?: RTCSessionDescriptionInit
  ): void {
    callState.startP2PCall(callId, caller, incomingCall, offer)
    callState.setVideoEnabled(videoEnabled)
  }

  endCall(remoteConnectionEnded: boolean): void {
    this.cleanupConnection()
    if (!remoteConnectionEnded && callState.isP2PCall) {
      callSignalingService.sendCallEnd(
        callState.p2pCallState!.user.id,
        callState.callId!,
        callState.duration
      )
    }
    callState.endCall()
  }

  async initiateCall(userId: number): Promise<void> {
    await this.setup(userId, true)
    if (!callState.p2pCallState) return
    const pc = callState.p2pCallState.peerConnection!
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    callSignalingService.sendOffer(userId, offer)
    this.noAnswer()
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit): Promise<void> {
    await this.setup(userId, false)
    if (!callState.p2pCallState) return
    const pc = callState.p2pCallState.peerConnection!
    const localStream = callState.p2pCallState.localStream!

    await pc.setRemoteDescription(offer)

    const transceivers = pc.getTransceivers()
    this.screenTransceiver = transceivers[2] ?? null

    if (this.screenTransceiver) {
      this.screenTransceiver.direction = 'sendrecv'
    }

    const audioTrack = localStream.getAudioTracks()[0]
    const videoTrack = localStream.getVideoTracks()[0]
    if (audioTrack) await transceivers[0].sender.replaceTrack(audioTrack)
    if (videoTrack) {
      videoTrack.enabled = callState.p2pCallState.isVideoEnabled ?? false
      await transceivers[1].sender.replaceTrack(videoTrack)
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    callSignalingService.sendAnswer(userId, answer)
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p?.peerConnection || p2p.peerConnection.currentRemoteDescription) return
    await p2p.peerConnection.setRemoteDescription(data.payload.response)
    for (const candidate of p2p.candidateQueue) {
      await p2p.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    callState.clearCandidateQueue()
  }

  async handleCallCandidate(data: WebSocketMessage<RTCIceCandidateInit>): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p?.peerConnection?.remoteDescription) {
      callState.queueCandidate(data.payload)
    } else {
      await p2p.peerConnection.addIceCandidate(new RTCIceCandidate(data.payload))
    }
  }

  async toggleVideo(): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p?.localStream) return
    const videoTrack = p2p.localStream.getVideoTracks()[0]
    if (!videoTrack) return
    videoTrack.enabled = !videoTrack.enabled
    callState.setVideoEnabled(videoTrack.enabled)
    callSignalingService.sendMediaState(
      p2p.user.id,
      videoTrack.enabled,
      p2p.isAudioEnabled,
      p2p.isScreenSharing
    )
  }

  async toggleAudio(): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p?.localStream) return
    const audioTrack = p2p.localStream.getAudioTracks()[0]
    if (!audioTrack) return
    audioTrack.enabled = !audioTrack.enabled
    callState.setAudioEnabled(audioTrack.enabled)
    callSignalingService.sendMediaState(
      p2p.user.id,
      p2p.isVideoEnabled,
      audioTrack.enabled,
      p2p.isScreenSharing
    )
  }

  async startScreenShare(): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p || !this.screenTransceiver) return
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      const screenTrack = screenStream.getVideoTracks()[0]
      await this.screenTransceiver.sender.replaceTrack(screenTrack)
      callState.setScreenSharing(true, screenTrack)
      callSignalingService.sendMediaState(p2p.user.id, p2p.isVideoEnabled, p2p.isAudioEnabled, true)
      screenTrack.onended = () => this.stopScreenShare()
    } catch (err) {
      errorService.reportError(`Error starting screen share: ${err}`)
    }
  }

  async stopScreenShare(): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p || !this.screenTransceiver) return
    p2p.screenShareTrack?.stop()
    await this.screenTransceiver.sender.replaceTrack(null)
    callState.setScreenSharing(false, null)
    callSignalingService.sendMediaState(p2p.user.id, p2p.isVideoEnabled, p2p.isAudioEnabled, false)
  }

  noAnswer(): void {
    this.noAnswerTimeout = setTimeout(() => {
      if (callState.status === 'connecting') {
        callSignalingService.sendNoAnswer()
        this.endCall(true)
      }
    }, 20000)
  }

  private clearNoAnswer(): void {
    if (this.noAnswerTimeout) {
      clearTimeout(this.noAnswerTimeout)
      this.noAnswerTimeout = null
    }
  }

  async getUserMedia(): Promise<MediaStream> {
    const stream = new MediaStream()

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStream.getAudioTracks().forEach((t) => stream.addTrack(t))
    } catch (e) {
      errorService.reportError('Microphone not available: ' + e.message)
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const dst = audioContext.createMediaStreamDestination()
      gainNode.gain.value = 0
      oscillator.connect(gainNode)
      gainNode.connect(dst)
      oscillator.start()
      dst.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
    }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoStream.getVideoTracks().forEach((t) => stream.addTrack(t))
    } catch (e) {
      errorService.reportError('Camera not available: ' + e.message)
    }

    return stream
  }

  private async setup(userId: number, isInitiator: boolean): Promise<void> {
    const localStream = await this.getUserMedia()
    const remoteStream = new MediaStream()
    const peerConnection = this.createPeerConnection(userId, isInitiator)

    if (isInitiator) {
      const transceivers = peerConnection.getTransceivers()
      const audioTrack = localStream.getAudioTracks()[0]
      const videoTrack = localStream.getVideoTracks()[0]
      if (audioTrack) await transceivers[0].sender.replaceTrack(audioTrack)
      if (videoTrack) {
        videoTrack.enabled = callState.p2pCallState?.isVideoEnabled ?? false
        await transceivers[1].sender.replaceTrack(videoTrack)
      }
    }

    callState.setConnection(peerConnection, localStream, remoteStream)
  }

  private createPeerConnection(userId: number, isInitiator: boolean): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    if (isInitiator) {
      pc.addTransceiver('audio', { direction: 'sendrecv' })
      pc.addTransceiver('video', { direction: 'sendrecv' })
      this.screenTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' })
    }

    pc.ontrack = (event) => {
      const track = event.track
      const transceivers = pc.getTransceivers()

      if (!this.screenTransceiver) {
        this.screenTransceiver = transceivers[2] ?? null
      }

      const isScreenShare = transceivers.indexOf(event.transceiver) === 2
      if (isScreenShare) {
        const screenStream = new MediaStream([track])
        callState.setRemoteScreenSharing(true, screenStream)
      } else {
        callState.p2pCallState?.remoteStream?.addTrack(track)
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) callSignalingService.sendCandidate(userId, e.candidate)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        this.clearNoAnswer()
        callState.setStatus('connected')
        this.startCallTimer()
        const p2p = callState.p2pCallState
        if (p2p) {
          callSignalingService.sendMediaState(
            p2p.user.id,
            p2p.isVideoEnabled,
            p2p.isAudioEnabled,
            p2p.isScreenSharing
          )
        }
      }
    }

    return pc
  }

  private cleanupConnection(): void {
    this.screenTransceiver = null
    callState.p2pCallState?.peerConnection?.close()
    callState.p2pCallState?.localStream?.getTracks().forEach((t) => t.stop())
    callState.p2pCallState?.screenShareTrack?.stop()
  }

  private startCallTimer(): void {
    const intervalId = setInterval(() => {
      callState.incrementDuration()
    }, 1000) as unknown as number
    callState.setDurationInterval(intervalId)
  }

  handleMediaState(video: boolean, screenShare: boolean): void {
    callState.setRemoteVideoEnabled(video)
    if (screenShare) {
      const transceiver = callState.p2pCallState?.peerConnection?.getTransceivers()?.[2]
      const track = transceiver?.receiver?.track
      if (track) {
        const stream = new MediaStream([track])
        callState.setRemoteScreenSharing(true, stream)
      }
    } else {
      callState.setRemoteScreenSharing(false, null)
    }
  }

  rejectCall(callId: number, recipientId: number): void {
    webSocketService.send({
      type: WebSocketMessageType.CALL_REJECTED,
      recipientId: recipientId,
      payload: String(callId)
    })
  }
}

export const callService = new CallService()
