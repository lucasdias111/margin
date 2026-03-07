import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { callState } from '$src/states/CallState.svelte'
import type {
  CallCandidatePayload,
  CallResponsePayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'
import type { User } from '$src/interfaces/User'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
]

class CallService {
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null
  private onLocalStreamCallback: ((stream: MediaStream) => void) | null = null
  private onRemoteScreenShareCallback: ((stream: MediaStream | null) => void) | null = null

  private audioTransceiver: RTCRtpTransceiver | null = null
  private cameraTransceiver: RTCRtpTransceiver | null = null
  private screenTransceiver: RTCRtpTransceiver | null = null

  startCall(
    callId: number,
    caller: User,
    incomingCall: boolean,
    offer?: RTCSessionDescriptionInit
  ): void {
    console.log('[CallService] ═══ startCall ═══', { callId, incomingCall, userId: caller.id })
    callState.startP2PCall(callId, caller, incomingCall, offer)
  }

  endCall(remoteConnectionEnded: boolean): void {
    console.log('[CallService] ═══ endCall ═══', {
      remoteConnectionEnded,
      isP2PCall: callState.isP2PCall
    })
    this.cleanupConnection()

    if (!remoteConnectionEnded && callState.isP2PCall) {
      console.log('[CallService] sending CALL_END to', callState.p2pCallState!.user.id)
      webSocketService.send({
        type: WebSocketMessageType.CALL_END,
        recipientId: callState.p2pCallState!.user.id,
        payload: {
          callId: callState.callId!,
          callDuration: callState.duration
        }
      })
    }

    callState.endCall()
  }

  private async getUserMedia(): Promise<MediaStream> {
    console.log('[CallService] getUserMedia — requesting audio + video')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      console.log('[CallService] getUserMedia ✓', {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      })
      return stream
    } catch (err) {
      console.warn('[CallService] getUserMedia ✗', err)
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
      console.log('[CallService] getUserMedia — returning silent fallback stream')
      return dst.stream
    }
  }

  private setupEventHandlers(
    peerConnection: RTCPeerConnection,
    remoteStream: MediaStream,
    userId: number
  ): void {
    console.log('[CallService] setupEventHandlers for userId', userId)

    peerConnection.ontrack = (event) => {
      const transceivers = peerConnection.getTransceivers()
      const screenMid = transceivers[2]?.mid

      console.log('[CallService] ontrack', {
        kind: event.track.kind,
        mid: event.transceiver.mid,
        screenMid,
        muted: event.track.muted,
        readyState: event.track.readyState
      })

      if (event.transceiver.mid === screenMid) {
        console.log('[CallService] ontrack — screen transceiver, wiring mute handlers')

        event.track.onunmute = () => {
          if (peerConnection.connectionState !== 'connected') {
            console.log('[CallService] screen onunmute ignored — not yet connected')
            return
          }
          console.log('[CallService] screen track unmuted — remote screen share started')
          const screenStream = new MediaStream([event.track])
          this.onRemoteScreenShareCallback?.(screenStream)
          callState.setRemoteScreenSharing(true)
        }

        event.track.onmute = () => {
          console.log('[CallService] screen track muted — remote screen share stopped')
          this.onRemoteScreenShareCallback?.(null)
          callState.setRemoteScreenSharing(false)
        }

        event.track.onended = () => {
          console.log('[CallService] screen track ended')
          this.onRemoteScreenShareCallback?.(null)
          callState.setRemoteScreenSharing(false)
        }
      } else {
        console.log('[CallService] ontrack — audio/camera track, adding to remoteStream')
        remoteStream.addTrack(event.track)
        callState.setStatus('connected')

        if (event.track.kind === 'video') {
          console.log('[CallService] camera track arrived', {
            muted: event.track.muted,
            enabled: event.track.enabled,
            readyState: event.track.readyState
          })
          this.onRemoteStreamCallback?.(remoteStream)
          callState.setRemoteVideoEnabled(true)
          console.log('[CallService] isRemoteVideoEnabled → true (initial)')

          event.track.onunmute = () => {
            console.log(
              '[CallService] camera track onunmute — connectionState:',
              peerConnection.connectionState
            )
            this.onRemoteStreamCallback?.(remoteStream)
            callState.setRemoteVideoEnabled(true)
            console.log('[CallService] isRemoteVideoEnabled → true (restored)')
          }

          event.track.onmute = () => {
            console.log(
              '[CallService] camera track onmute — connectionState:',
              peerConnection.connectionState
            )
            if (peerConnection.connectionState !== 'connected') {
              console.log('[CallService] camera onmute ignored — not yet connected')
              return
            }
            callState.setRemoteVideoEnabled(false)
            console.log('[CallService] isRemoteVideoEnabled → false (disabled by remote)')
          }
        } else {
          console.log('[CallService] audio track arrived')
          this.onRemoteStreamCallback?.(remoteStream)
        }
      }
    }

    peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (!event.candidate) {
        console.log('[CallService] ICE gathering complete (null candidate)')
        return
      }
      console.log('[CallService] ICE candidate gathered', {
        type: event.candidate.type,
        protocol: event.candidate.protocol,
        address: event.candidate.address
      })
      webSocketService.send<RTCIceCandidate>({
        type: WebSocketMessageType.CALL_CANDIDATE,
        recipientId: userId,
        payload: event.candidate
      })
    }

    peerConnection.onicegatheringstatechange = () => {
      console.log('[CallService] ICE gathering state:', peerConnection.iceGatheringState)
    }

    peerConnection.oniceconnectionstatechange = () => {
      console.log('[CallService] ICE connection state:', peerConnection.iceConnectionState)
    }

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState
      console.log('[CallService] ═══ connection state:', state, '═══')
      if (state === 'connected') {
        console.log('[CallService] ✓ CONNECTED — starting timer')
        this.startCallTimer()
        callState.setStatus('connected')
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log('[CallService] ✗ connection lost —', state)
        this.endCall(true)
      }
    }
  }

  async initiateCall(userId: number): Promise<void> {
    console.log('[CallService] ═══ initiateCall for userId', userId, '═══')
    const localStream = await this.getUserMedia()

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    console.log(
      '[CallService] peerConnection created (initiator) with',
      ICE_SERVERS.length,
      'ice server entries'
    )

    this.audioTransceiver = peerConnection.addTransceiver('audio', { direction: 'sendrecv' })
    this.cameraTransceiver = peerConnection.addTransceiver('video', { direction: 'sendrecv' })
    this.screenTransceiver = peerConnection.addTransceiver('video', { direction: 'sendrecv' })
    console.log('[CallService] transceivers added [audio, camera, screen]')

    const audioTrack = localStream.getAudioTracks()[0]
    const videoTrack = localStream.getVideoTracks()[0]
    if (audioTrack) await this.audioTransceiver.sender.replaceTrack(audioTrack)
    if (videoTrack) {
      await this.cameraTransceiver.sender.replaceTrack(videoTrack)
      videoTrack.enabled = callState.p2pCallState?.isVideoEnabled ?? false
      console.log('[CallService] local video track enabled:', videoTrack.enabled)
    }

    const remoteStream = new MediaStream()
    this.setupEventHandlers(peerConnection, remoteStream, userId)
    callState.setConnection(peerConnection, localStream, remoteStream)
    this.onLocalStreamCallback?.(localStream)

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    console.log('[CallService] offer created and set as local description')

    webSocketService.send<RTCSessionDescriptionInit>({
      type: WebSocketMessageType.CALL_OFFER,
      recipientId: userId,
      payload: offer
    })
    console.log('[CallService] CALL_OFFER sent to', userId)
  }

  async answerCall(userId: number, offer: RTCSessionDescriptionInit | string): Promise<void> {
    console.log('[CallService] ═══ answerCall for userId', userId, '═══')
    const parsedOffer = typeof offer === 'string' ? JSON.parse(offer) : offer
    const localStream = await this.getUserMedia()

    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    console.log(
      '[CallService] peerConnection created (answerer) with',
      ICE_SERVERS.length,
      'ice server entries'
    )

    const remoteStream = new MediaStream()
    this.setupEventHandlers(peerConnection, remoteStream, userId)
    callState.setConnection(peerConnection, localStream, remoteStream)
    this.onLocalStreamCallback?.(localStream)

    await peerConnection.setRemoteDescription(new RTCSessionDescription(parsedOffer))
    console.log('[CallService] remote description set from offer')

    const transceivers = peerConnection.getTransceivers()
    this.audioTransceiver = transceivers[0]
    this.cameraTransceiver = transceivers[1]
    this.screenTransceiver = transceivers[2]

    this.audioTransceiver.direction = 'sendrecv'
    this.cameraTransceiver.direction = 'sendrecv'
    this.screenTransceiver.direction = 'sendrecv'
    console.log('[CallService] transceivers grabbed and forced to sendrecv')

    const audioTrack = localStream.getAudioTracks()[0]
    const videoTrack = localStream.getVideoTracks()[0]
    if (audioTrack) this.audioTransceiver.sender.replaceTrack(audioTrack)
    if (videoTrack) {
      this.cameraTransceiver.sender.replaceTrack(videoTrack)
      videoTrack.enabled = callState.p2pCallState?.isVideoEnabled ?? false
      console.log('[CallService] local video track enabled:', videoTrack.enabled)
    }

    await this.processQueuedCandidates()
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    console.log('[CallService] answer created and set as local description')

    webSocketService.send<CallResponsePayload>({
      type: WebSocketMessageType.CALL_RESPONSE,
      recipientId: userId,
      payload: {
        callId: callState.callId!,
        callerId: userId,
        response: answer
      }
    })
    console.log('[CallService] CALL_RESPONSE sent to', userId)
  }

  async handleCallResponse(data: WebSocketMessage<CallResponsePayload>): Promise<void> {
    console.log('[CallService] handleCallResponse received')
    if (!callState.isP2PCall || !callState.p2pCallState?.peerConnection) {
      console.warn('[CallService] handleCallResponse — no active call, ignoring')
      return
    }

    const response = data.payload.response
    const parsedAnswer = typeof response === 'string' ? JSON.parse(response) : response

    await callState.p2pCallState.peerConnection.setRemoteDescription(
      new RTCSessionDescription(parsedAnswer)
    )
    console.log('[CallService] remote description set from answer')
    await this.processQueuedCandidates()
  }

  async handleIceCandidate(data: WebSocketMessage<CallCandidatePayload>): Promise<void> {
    if (!data.payload || !callState.isP2PCall) {
      console.warn('[CallService] handleIceCandidate — no payload or no active call, ignoring')
      return
    }

    const { candidate, sdpMid, sdpMLineIndex, usernameFragment } = data.payload
    const rtcCandidate = new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })

    console.log('[CallService] handleIceCandidate', {
      type: rtcCandidate.type,
      protocol: rtcCandidate.protocol,
      sdpMid
    })

    if (!callState.p2pCallState?.peerConnection) {
      console.log('[CallService] peerConnection not ready — queuing candidate')
      callState.queueCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })
      return
    }

    if (callState.p2pCallState.peerConnection.remoteDescription) {
      console.log('[CallService] adding ICE candidate')
      await callState.p2pCallState.peerConnection.addIceCandidate(rtcCandidate)
    } else {
      console.log('[CallService] remote description not set yet — queuing candidate')
      callState.queueCandidate({ candidate, sdpMid, sdpMLineIndex, usernameFragment })
    }
  }

  async toggleVideo(): Promise<void> {
    console.log('[CallService] toggleVideo')
    if (!callState.isP2PCall || !this.cameraTransceiver) {
      console.warn('[CallService] toggleVideo — no active call or no cameraTransceiver')
      return
    }

    const isCurrentlyEnabled = callState.p2pCallState?.isVideoEnabled ?? false
    console.log('[CallService] toggleVideo — currently enabled:', isCurrentlyEnabled)

    if (isCurrentlyEnabled) {
      const videoTrack = callState.p2pCallState?.localStream?.getVideoTracks()[0]
      videoTrack?.stop()
      await this.cameraTransceiver.sender.replaceTrack(null)
      callState.setVideoEnabled(false)
      console.log('[CallService] video disabled — replaceTrack(null) sent')
    } else {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      const newTrack = newStream.getVideoTracks()[0]
      await this.cameraTransceiver.sender.replaceTrack(newTrack)

      const localStream = callState.p2pCallState!.localStream!
      localStream.getVideoTracks().forEach((t) => localStream.removeTrack(t))
      localStream.addTrack(newTrack)

      callState.setVideoEnabled(true)
      this.onLocalStreamCallback?.(localStream)
      console.log('[CallService] video re-enabled with new track')
    }
  }

  async startScreenShare(): Promise<void> {
    console.log('[CallService] startScreenShare')
    if (!callState.isP2PCall || !this.screenTransceiver) {
      console.warn('[CallService] startScreenShare — no active call or no screenTransceiver')
      return
    }
    if (callState.p2pCallState?.isScreenSharing || callState.p2pCallState?.isRemoteScreenSharing) {
      console.warn('[CallService] startScreenShare — screen share already active')
      return
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      const screenTrack = screenStream.getVideoTracks()[0]
      console.log('[CallService] screen track acquired')

      await this.screenTransceiver.sender.replaceTrack(screenTrack)
      callState.setScreenSharing(true, screenTrack)

      screenTrack.onended = () => {
        console.log('[CallService] screen track ended by user')
        this.stopScreenShare()
      }
    } catch (err) {
      console.error('[CallService] startScreenShare error:', err)
    }
  }

  async stopScreenShare(): Promise<void> {
    console.log('[CallService] stopScreenShare')
    if (!callState.isP2PCall || !callState.p2pCallState?.isScreenSharing) {
      console.warn('[CallService] stopScreenShare — no active screen share')
      return
    }

    callState.p2pCallState.screenShareTrack?.stop()
    await this.screenTransceiver?.sender.replaceTrack(null)
    callState.setScreenSharing(false, null)
    console.log('[CallService] screen share stopped')
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    console.log('[CallService] onRemoteStream callback registered')
    this.onRemoteStreamCallback = callback
  }

  onLocalStream(callback: (stream: MediaStream) => void): void {
    console.log('[CallService] onLocalStream callback registered')
    this.onLocalStreamCallback = callback
  }

  onRemoteScreenShare(callback: (stream: MediaStream | null) => void): void {
    console.log('[CallService] onRemoteScreenShare callback registered')
    this.onRemoteScreenShareCallback = callback
  }

  private async processQueuedCandidates(): Promise<void> {
    if (!callState.isP2PCall) return
    const pc = callState.p2pCallState?.peerConnection
    if (!pc) return

    const queue = callState.p2pCallState!.candidateQueue
    console.log('[CallService] processQueuedCandidates — queue length:', queue.length)
    for (const candidate of queue) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
    callState.clearCandidateQueue()
    console.log('[CallService] candidate queue cleared')
  }

  private startCallTimer(): void {
    const intervalId = setInterval(() => {
      callState.incrementDuration()
    }, 1000) as unknown as number
    callState.setDurationInterval(intervalId)
  }

  private cleanupConnection(): void {
    console.log('[CallService] cleanupConnection')
    if (!callState.isP2PCall || !callState.p2pCallState) {
      console.warn('[CallService] cleanupConnection — nothing to clean up')
      return
    }
    callState.p2pCallState.peerConnection?.close()
    callState.p2pCallState.localStream?.getTracks().forEach((track) => {
      console.log('[CallService] stopping track:', track.kind)
      track.stop()
    })
    callState.p2pCallState.screenShareTrack?.stop()
    this.audioTransceiver = null
    this.cameraTransceiver = null
    this.screenTransceiver = null
    console.log('[CallService] transceivers nulled')
  }

  cleanup(): void {
    console.log('[CallService] cleanup')
    this.cleanupConnection()
    this.onRemoteStreamCallback = null
    this.onLocalStreamCallback = null
    this.onRemoteScreenShareCallback = null
    console.log('[CallService] all callbacks cleared')
  }
}

export const callService = new CallService()
