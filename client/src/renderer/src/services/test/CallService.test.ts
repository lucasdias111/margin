import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callService } from '../call/CallService'
import { callState } from '$src/states/CallState.svelte.js'
import { callSignalingService } from '$src/services/call/CallSignalingService'
import { webSocketService } from '$src/services/WebSocketService'
import { deviceService } from '$src/services/DeviceService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { User } from '$src/interfaces/User'
import type { CallResponsePayload, WebSocketMessage } from '$src/interfaces/WebSocketMessages'

globalThis.RTCIceCandidate = vi.fn(function (init: RTCIceCandidateInit) {
  return init
}) as unknown as typeof RTCIceCandidate

globalThis.MediaStream = vi.fn(function (tracks?: MediaStreamTrack[]) {
  return { getTracks: () => tracks ?? [], getAudioTracks: () => [], getVideoTracks: () => [] }
}) as unknown as typeof MediaStream

interface MockP2PCallState {
  user: User
  peerConnection: Partial<RTCPeerConnection> | null
  localStream: Partial<MediaStream> | null
  remoteStream: Partial<MediaStream> | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
  screenShareTrack: Partial<MediaStreamTrack> | null
  candidateQueue: RTCIceCandidateInit[]
}

interface MockCallState {
  callId: number | null
  status: string
  duration: number
  isP2PCall: boolean
  p2pCallState: MockP2PCallState | null
  startP2PCall: ReturnType<typeof vi.fn>
  endCall: ReturnType<typeof vi.fn>
  setVideoEnabled: ReturnType<typeof vi.fn>
  setAudioEnabled: ReturnType<typeof vi.fn>
  setScreenSharing: ReturnType<typeof vi.fn>
  setRemoteVideoEnabled: ReturnType<typeof vi.fn>
  setRemoteScreenSharing: ReturnType<typeof vi.fn>
  setConnection: ReturnType<typeof vi.fn>
  setStatus: ReturnType<typeof vi.fn>
  setDurationInterval: ReturnType<typeof vi.fn>
  incrementDuration: ReturnType<typeof vi.fn>
  queueCandidate: ReturnType<typeof vi.fn>
  clearCandidateQueue: ReturnType<typeof vi.fn>
}

vi.mock('$src/states/CallState.svelte.js', () => ({
  callState: {
    callId: null,
    status: 'idle',
    duration: 0,
    isP2PCall: true,
    p2pCallState: null,
    startP2PCall: vi.fn(),
    endCall: vi.fn(),
    setVideoEnabled: vi.fn(),
    setAudioEnabled: vi.fn(),
    setScreenSharing: vi.fn(),
    setRemoteVideoEnabled: vi.fn(),
    setRemoteScreenSharing: vi.fn(),
    setConnection: vi.fn(),
    setStatus: vi.fn(),
    setDurationInterval: vi.fn(),
    incrementDuration: vi.fn(),
    queueCandidate: vi.fn(),
    clearCandidateQueue: vi.fn()
  }
}))

vi.mock('$src/services/call/CallSignalingService', () => ({
  callSignalingService: {
    sendOffer: vi.fn(),
    sendAnswer: vi.fn(),
    sendCandidate: vi.fn(),
    sendCallEnd: vi.fn(),
    sendNoAnswer: vi.fn(),
    sendMediaState: vi.fn()
  }
}))

vi.mock('$src/services/WebSocketService', () => ({
  webSocketService: {
    send: vi.fn()
  }
}))

vi.mock('$src/services/DeviceService', () => ({
  deviceService: {
    cleanup: vi.fn(),
    enumerateDevices: vi.fn(),
    startListening: vi.fn()
  }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: {
    reportError: vi.fn()
  }
}))

const mockCallState = callState as unknown as MockCallState

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 2,
    username: 'kasper',
    displayName: 'Kasper',
    email: 'kasper@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    isOnline: true,
    ...overrides
  }
}

function buildP2PCallState(overrides: Partial<MockP2PCallState> = {}): MockP2PCallState {
  return {
    user: buildUser(),
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: false,
    isAudioEnabled: true,
    isScreenSharing: false,
    screenShareTrack: null,
    candidateQueue: [],
    ...overrides
  }
}

describe('CallService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockCallState.callId = null
    mockCallState.status = 'idle'
    mockCallState.duration = 0
    mockCallState.isP2PCall = true
    mockCallState.p2pCallState = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- startCall ---

  describe('startCall', () => {
    it('delegates to callState.startP2PCall and sets video', () => {
      const user = buildUser()
      const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'test-sdp' }

      callService.startCall(1, user, true, true, offer)

      expect(mockCallState.startP2PCall).toHaveBeenCalledWith(1, user, true, offer)
      expect(mockCallState.setVideoEnabled).toHaveBeenCalledWith(true)
    })

    it('works without an offer for outgoing calls', () => {
      const user = buildUser()

      callService.startCall(1, user, false, false)

      expect(mockCallState.startP2PCall).toHaveBeenCalledWith(1, user, false, undefined)
      expect(mockCallState.setVideoEnabled).toHaveBeenCalledWith(false)
    })
  })

  // --- endCall ---

  describe('endCall', () => {
    it('sends call end signal for local hangup on P2P call', () => {
      mockCallState.isP2PCall = true
      mockCallState.callId = 42
      mockCallState.duration = 120
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: { close: vi.fn() },
        localStream: { getTracks: vi.fn().mockReturnValue([]) }
      })

      callService.endCall(false)

      expect(callSignalingService.sendCallEnd).toHaveBeenCalledWith(2, 42, 120)
      expect(deviceService.cleanup).toHaveBeenCalled()
      expect(mockCallState.endCall).toHaveBeenCalled()
    })

    it('does not send call end signal when remote already ended', () => {
      mockCallState.isP2PCall = true
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: { close: vi.fn() },
        localStream: { getTracks: vi.fn().mockReturnValue([]) }
      })

      callService.endCall(true)

      expect(callSignalingService.sendCallEnd).not.toHaveBeenCalled()
      expect(mockCallState.endCall).toHaveBeenCalled()
    })

    it('closes peer connection and stops local tracks', () => {
      const closeFn = vi.fn()
      const stopFn = vi.fn()
      const track = { stop: stopFn }
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: { close: closeFn },
        localStream: { getTracks: vi.fn().mockReturnValue([track]) },
        screenShareTrack: { stop: vi.fn() }
      })

      callService.endCall(true)

      expect(closeFn).toHaveBeenCalled()
      expect(stopFn).toHaveBeenCalled()
    })
  })

  // --- handleCallResponse ---

  describe('handleCallResponse', () => {
    it('sets remote description and flushes candidate queues', async () => {
      const setRemoteDescription = vi.fn()
      const addIceCandidate = vi.fn()
      const candidate: RTCIceCandidateInit = { candidate: 'test', sdpMLineIndex: 0 }
      const answer: RTCSessionDescriptionInit = { type: 'answer', sdp: 'answer-sdp' }

      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: {
          currentRemoteDescription: null,
          setRemoteDescription,
          addIceCandidate
        },
        candidateQueue: [candidate]
      })

      const data: WebSocketMessage<CallResponsePayload> = {
        timestamp: 0,
        type: WebSocketMessageType.CALL_RESPONSE,
        payload: {
          response: answer,
          callId: 0,
          callerId: 0
        }
      }

      await callService.handleCallResponse(data)

      expect(setRemoteDescription).toHaveBeenCalledWith(answer)
      expect(addIceCandidate).toHaveBeenCalled()
      expect(mockCallState.clearCandidateQueue).toHaveBeenCalled()
    })

    it('does nothing if remote description already set', async () => {
      const setRemoteDescription = vi.fn()
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: {
          currentRemoteDescription: { type: 'answer', sdp: 'existing' } as RTCSessionDescription,
          setRemoteDescription
        }
      })

      const data: WebSocketMessage<CallResponsePayload> = {
        timestamp: 0,
        type: WebSocketMessageType.CALL_RESPONSE,
        payload: {
          response: { type: 'answer', sdp: 'new' },
          callId: 0,
          callerId: 0
        }
      }

      await callService.handleCallResponse(data)

      expect(setRemoteDescription).not.toHaveBeenCalled()
    })

    it('does nothing if no peer connection exists', async () => {
      mockCallState.p2pCallState = null

      const data: WebSocketMessage<CallResponsePayload> = {
        timestamp: 0,
        type: WebSocketMessageType.CALL_RESPONSE,
        payload: {
          response: { type: 'answer', sdp: 'sdp' },
          callId: 0,
          callerId: 0
        }
      }

      await callService.handleCallResponse(data)

      expect(mockCallState.clearCandidateQueue).not.toHaveBeenCalled()
    })
  })

  // --- handleCallCandidate ---

  describe('handleCallCandidate', () => {
    it('queues candidate when remote description not yet set', async () => {
      const candidate: RTCIceCandidateInit = { candidate: 'test', sdpMLineIndex: 0 }
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: { remoteDescription: null }
      })

      const data: WebSocketMessage<RTCIceCandidateInit> = {
        timestamp: 0,
        type: WebSocketMessageType.CALL_CANDIDATE,
        payload: candidate
      }

      await callService.handleCallCandidate(data)

      expect(mockCallState.queueCandidate).toHaveBeenCalledWith(candidate)
    })

    it('adds candidate directly when remote description is set', async () => {
      const addIceCandidate = vi.fn()
      const candidate: RTCIceCandidateInit = { candidate: 'test', sdpMLineIndex: 0 }
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: {
          remoteDescription: { type: 'answer', sdp: 'sdp' } as RTCSessionDescription,
          addIceCandidate
        }
      })

      const data: WebSocketMessage<RTCIceCandidateInit> = {
        timestamp: 0,
        type: WebSocketMessageType.CALL_CANDIDATE,
        payload: candidate
      }

      await callService.handleCallCandidate(data)

      expect(addIceCandidate).toHaveBeenCalled()
      expect(mockCallState.queueCandidate).not.toHaveBeenCalled()
    })
  })

  // --- toggleVideo ---

  describe('toggleVideo', () => {
    it('disables video by replacing track with null', async () => {
      const replaceTrack = vi.fn()
      const videoTrack = { kind: 'video', enabled: true }
      mockCallState.p2pCallState = buildP2PCallState({
        isVideoEnabled: true,
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{}, { sender: { replaceTrack } }, {}])
        },
        localStream: { getVideoTracks: vi.fn().mockReturnValue([videoTrack]) }
      })

      await callService.toggleVideo()

      expect(replaceTrack).toHaveBeenCalledWith(null)
      expect(mockCallState.setVideoEnabled).toHaveBeenCalledWith(false)
      expect(callSignalingService.sendMediaState).toHaveBeenCalledWith(2, false, true, false)
    })

    it('enables video by replacing track with video track', async () => {
      const replaceTrack = vi.fn()
      const videoTrack = { kind: 'video', enabled: true }
      mockCallState.p2pCallState = buildP2PCallState({
        isVideoEnabled: false,
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{}, { sender: { replaceTrack } }, {}])
        },
        localStream: { getVideoTracks: vi.fn().mockReturnValue([videoTrack]) }
      })

      await callService.toggleVideo()

      expect(replaceTrack).toHaveBeenCalledWith(videoTrack)
      expect(mockCallState.setVideoEnabled).toHaveBeenCalledWith(true)
    })

    it('does nothing when no peer connection', async () => {
      mockCallState.p2pCallState = null

      await callService.toggleVideo()

      expect(mockCallState.setVideoEnabled).not.toHaveBeenCalled()
    })
  })

  // --- toggleAudio ---

  describe('toggleAudio', () => {
    it('toggles audio track enabled state', async () => {
      const audioTrack = { kind: 'audio', enabled: true }
      mockCallState.p2pCallState = buildP2PCallState({
        isVideoEnabled: false,
        isAudioEnabled: true,
        localStream: { getAudioTracks: vi.fn().mockReturnValue([audioTrack]) }
      })

      await callService.toggleAudio()

      expect(audioTrack.enabled).toBe(false)
      expect(mockCallState.setAudioEnabled).toHaveBeenCalledWith(false)
      expect(callSignalingService.sendMediaState).toHaveBeenCalledWith(2, false, false, false)
    })

    it('does nothing when no local stream', async () => {
      mockCallState.p2pCallState = null

      await callService.toggleAudio()

      expect(mockCallState.setAudioEnabled).not.toHaveBeenCalled()
    })
  })

  // --- handleMediaState ---

  describe('handleMediaState', () => {
    it('sets remote video enabled', () => {
      mockCallState.p2pCallState = buildP2PCallState()

      callService.handleMediaState(true, false)

      expect(mockCallState.setRemoteVideoEnabled).toHaveBeenCalledWith(true)
      expect(mockCallState.setRemoteScreenSharing).toHaveBeenCalledWith(false, null)
    })

    it('sets remote screen sharing with stream from transceiver', () => {
      const track = { id: 'screen-track' }
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{}, {}, { receiver: { track } }])
        }
      })

      callService.handleMediaState(false, true)

      expect(mockCallState.setRemoteVideoEnabled).toHaveBeenCalledWith(false)
      expect(mockCallState.setRemoteScreenSharing).toHaveBeenCalledWith(true, expect.any(Object))
    })
  })

  // --- rejectCall ---

  describe('rejectCall', () => {
    it('sends rejection via WebSocket', () => {
      callService.rejectCall(42, 2)

      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.CALL_REJECTED,
        recipientId: 2,
        payload: '42'
      })
    })
  })

  // --- noAnswer timeout ---

  describe('noAnswer', () => {
    it('sends no answer and ends call after 20 seconds if still connecting', () => {
      mockCallState.callId = 1
      mockCallState.status = 'connecting'
      mockCallState.p2pCallState = buildP2PCallState({
        peerConnection: { close: vi.fn() },
        localStream: { getTracks: vi.fn().mockReturnValue([]) }
      })

      callService.noAnswer()
      vi.advanceTimersByTime(20000)

      expect(callSignalingService.sendNoAnswer).toHaveBeenCalled()
      expect(mockCallState.endCall).toHaveBeenCalled()
    })

    it('does not end call if status changed before timeout', () => {
      mockCallState.callId = 1
      mockCallState.status = 'connecting'

      callService.noAnswer()
      mockCallState.status = 'connected'
      vi.advanceTimersByTime(20000)

      expect(callSignalingService.sendNoAnswer).not.toHaveBeenCalled()
    })

    it('does not end call if callId changed before timeout', () => {
      mockCallState.callId = 1
      mockCallState.status = 'connecting'

      callService.noAnswer()
      mockCallState.callId = 2
      vi.advanceTimersByTime(20000)

      expect(callSignalingService.sendNoAnswer).not.toHaveBeenCalled()
    })
  })
})
