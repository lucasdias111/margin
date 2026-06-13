import { callState } from '$src/states/CallState.svelte.js'
import { callSignalingService } from '$src/services/call/CallSignalingService'
import type { User } from '$src/interfaces/User'
import type { CallResponsePayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { errorService } from '$src/services/ErrorService'
import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import {
  deviceService,
  defaultDeviceConstraint,
  getUserMediaPreferringDefault
} from '$src/services/DeviceService'
import { ICE_SERVERS } from '$src/services/call/iceServers'

class CallService {
  private noAnswerTimeout: ReturnType<typeof setTimeout> | null = null
  private screenTransceiver: RTCRtpTransceiver | null = null
  private pendingCandidates: RTCIceCandidate[] = []

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
    this.clearNoAnswer()
    this.cleanupConnection()
    deviceService.cleanup()
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

    for (const transceiver of transceivers) {
      transceiver.direction = 'sendrecv'
    }

    const audioTrack = localStream.getAudioTracks()[0]
    const videoTrack = localStream.getVideoTracks()[0]
    if (audioTrack) await transceivers[0].sender.replaceTrack(audioTrack)
    if (videoTrack) await transceivers[1].sender.replaceTrack(videoTrack)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    callSignalingService.sendAnswer(userId, answer)
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    const p2p = callState.p2pCallState
    if (!p2p?.peerConnection || p2p.peerConnection.currentRemoteDescription) return
    this.clearNoAnswer()
    await p2p.peerConnection.setRemoteDescription(data.payload.response)

    for (const candidate of p2p.candidateQueue) {
      await p2p.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    callState.clearCandidateQueue()

    const userId = p2p.user.id
    for (const candidate of this.pendingCandidates) {
      callSignalingService.sendCandidate(userId, candidate)
    }
    this.pendingCandidates = []
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
    if (!p2p?.peerConnection || !p2p.localStream) return
    const videoTrack = p2p.localStream.getVideoTracks()[0]
    if (!videoTrack) return

    const newEnabled = !p2p.isVideoEnabled
    const transceiver = p2p.peerConnection.getTransceivers()[1]

    if (newEnabled) {
      await transceiver.sender.replaceTrack(videoTrack)
    } else {
      await transceiver.sender.replaceTrack(null)
    }

    callState.setVideoEnabled(newEnabled)
    callSignalingService.sendMediaState(
      p2p.user.id,
      newEnabled,
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
    this.clearNoAnswer()
    const callId = callState.callId
    this.noAnswerTimeout = setTimeout(() => {
      if (callState.status === 'connecting' && callState.callId === callId) {
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
      const audioStream = await getUserMediaPreferringDefault(
        { audio: defaultDeviceConstraint() },
        { audio: true }
      )
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
      const videoStream = await getUserMediaPreferringDefault(
        { video: defaultDeviceConstraint() },
        { video: true }
      )
      videoStream.getVideoTracks().forEach((t) => stream.addTrack(t))
    } catch (e) {
      errorService.reportError('Camera not available: ' + e.message)
    }

    return stream
  }

  private async setup(userId: number, isInitiator: boolean): Promise<void> {
    const localStream = await this.getUserMedia()
    const remoteStream = new MediaStream()
    const peerConnection = this.createPeerConnection(userId, isInitiator, remoteStream)

    if (isInitiator) {
      const transceivers = peerConnection.getTransceivers()
      const audioTrack = localStream.getAudioTracks()[0]
      const videoTrack = localStream.getVideoTracks()[0]
      if (audioTrack) await transceivers[0].sender.replaceTrack(audioTrack)
      if (videoTrack) await transceivers[1].sender.replaceTrack(videoTrack)
    }

    callState.setConnection(peerConnection, localStream, remoteStream)

    await deviceService.enumerateDevices()
    deviceService.startListening()
  }

  private createPeerConnection(
    userId: number,
    isInitiator: boolean,
    remoteStream: MediaStream
  ): RTCPeerConnection {
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
        callState.setRemoteScreenSharing(false, screenStream)
        return
      }

      remoteStream.addTrack(track)
    }

    pc.onicecandidate = (e) => {
      if (!e.candidate) return
      if (isInitiator) {
        this.pendingCandidates.push(e.candidate)
      } else {
        callSignalingService.sendCandidate(userId, e.candidate)
      }
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
    this.pendingCandidates = []
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
