import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deviceService } from '../DeviceService'
import { callState } from '$src/states/CallState.svelte'
import { deviceState } from '$src/states/DeviceState.svelte'

vi.mock('$src/states/CallState.svelte', () => ({
  callState: {
    p2pCallState: null,
    groupCallState: null
  }
}))

vi.mock('$src/states/DeviceState.svelte', () => ({
  deviceState: {
    audioInputs: [],
    videoInputs: [],
    selectedAudioDeviceId: undefined,
    selectedVideoDeviceId: undefined,
    setAudioInputs: vi.fn(),
    setVideoInputs: vi.fn(),
    setSelectedAudioDeviceId: vi.fn(),
    setSelectedVideoDeviceId: vi.fn(),
    clear: vi.fn()
  }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: { reportError: vi.fn() }
}))

const mockMediaDevices = {
  getUserMedia: vi.fn(),
  enumerateDevices: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
  configurable: true
})

const mockCallState = callState as {
  p2pCallState: unknown
  groupCallState: unknown
}

const mockDeviceState = deviceState as unknown as {
  selectedAudioDeviceId: string | undefined
  selectedVideoDeviceId: string | undefined
  setAudioInputs: ReturnType<typeof vi.fn>
  setVideoInputs: ReturnType<typeof vi.fn>
  setSelectedAudioDeviceId: ReturnType<typeof vi.fn>
  setSelectedVideoDeviceId: ReturnType<typeof vi.fn>
  clear: ReturnType<typeof vi.fn>
}

function makeMockTrack(deviceId = 'default-device'): MediaStreamTrack {
  return {
    stop: vi.fn(),
    enabled: true,
    getSettings: vi.fn().mockReturnValue({ deviceId })
  } as unknown as MediaStreamTrack
}

function makeMockStream(
  audioTracks: MediaStreamTrack[] = [],
  videoTracks: MediaStreamTrack[] = []
): MediaStream {
  return {
    getAudioTracks: vi.fn().mockReturnValue(audioTracks),
    getVideoTracks: vi.fn().mockReturnValue(videoTracks),
    getTracks: vi.fn().mockReturnValue([...audioTracks, ...videoTracks]),
    addTrack: vi.fn(),
    removeTrack: vi.fn()
  } as unknown as MediaStream
}

type MockProducer = { replaceTrack: ReturnType<typeof vi.fn> }

type MockGroupCallState = {
  session:
    | {
        localStream: MediaStream
        audioProducer: MockProducer | null
        videoProducer: MockProducer | null
      }
    | null
    | object
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

type MockP2PCallState = {
  localStream: MediaStream | null
  peerConnection: object | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
}

function makeMockProducer(): MockProducer {
  return { replaceTrack: vi.fn() }
}

function makeMockGroupCallState(
  overrides: {
    session?: object | null
    isAudioEnabled?: boolean
    isVideoEnabled?: boolean
  } = {}
): MockGroupCallState {
  const {
    session = {
      localStream: makeMockStream([makeMockTrack()]),
      audioProducer: makeMockProducer(),
      videoProducer: null
    },
    isAudioEnabled = true,
    isVideoEnabled = false
  } = overrides
  return { session, isAudioEnabled, isVideoEnabled }
}

function makeMockP2PCallState(
  overrides: {
    localStream?: MediaStream | null
    peerConnection?: object | null
    isAudioEnabled?: boolean
    isVideoEnabled?: boolean
  } = {}
): MockP2PCallState {
  return {
    localStream: makeMockStream([makeMockTrack()]),
    peerConnection: null,
    isAudioEnabled: true,
    isVideoEnabled: false,
    ...overrides
  }
}

beforeEach(() => {
  mockCallState.p2pCallState = null
  mockCallState.groupCallState = null

  const newTrack = makeMockTrack('new-device')
  const newStream = makeMockStream([newTrack], [newTrack])
  mockMediaDevices.getUserMedia.mockResolvedValue(newStream)
})

describe('DeviceService.switchAudioDevice', () => {
  describe('group call', () => {
    it('calls getUserMedia with the given deviceId', async () => {
      const localStream = makeMockStream([makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: makeMockProducer(), videoProducer: null }
      })

      await deviceService.switchAudioDevice('mic-2')

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: { deviceId: { exact: 'mic-2' } }
      })
    })

    it('replaces the track on the audio producer', async () => {
      const audioProducer = makeMockProducer()
      const localStream = makeMockStream([makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer, videoProducer: null }
      })
      const newTrack = makeMockTrack('mic-2')
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([newTrack]))

      await deviceService.switchAudioDevice('mic-2')

      expect(audioProducer.replaceTrack).toHaveBeenCalledWith({ track: newTrack })
    })

    it('swaps the track in localStream', async () => {
      const oldTrack = makeMockTrack('old-mic')
      const newTrack = makeMockTrack('mic-2')
      const localStream = makeMockStream([oldTrack])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: makeMockProducer(), videoProducer: null }
      })
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([newTrack]))

      await deviceService.switchAudioDevice('mic-2')

      expect(localStream.removeTrack as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(oldTrack)
      expect(oldTrack.stop as ReturnType<typeof vi.fn>).toHaveBeenCalled()
      expect(localStream.addTrack as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(newTrack)
    })

    it('sets new track enabled to match group isAudioEnabled', async () => {
      const newTrack = makeMockTrack('mic-2')
      const localStream = makeMockStream([makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: makeMockProducer(), videoProducer: null },
        isAudioEnabled: false
      })
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([newTrack]))

      await deviceService.switchAudioDevice('mic-2')

      expect(newTrack.enabled).toBe(false)
    })

    it('updates deviceState.selectedAudioDeviceId', async () => {
      mockCallState.groupCallState = makeMockGroupCallState()

      await deviceService.switchAudioDevice('mic-2')

      expect(mockDeviceState.setSelectedAudioDeviceId).toHaveBeenCalledWith('mic-2')
    })

    it('skips replaceTrack when audioProducer is null', async () => {
      const localStream = makeMockStream([makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: null, videoProducer: null }
      })

      await deviceService.switchAudioDevice('mic-2')

      expect(mockDeviceState.setSelectedAudioDeviceId).toHaveBeenCalledWith('mic-2')
    })

    it('does nothing when session is null', async () => {
      mockCallState.groupCallState = makeMockGroupCallState({ session: null })

      await deviceService.switchAudioDevice('mic-2')

      expect(mockMediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(mockDeviceState.setSelectedAudioDeviceId).not.toHaveBeenCalled()
    })
  })

  describe('P2P call', () => {
    it('replaces track on the first transceiver sender', async () => {
      const replaceTrack = vi.fn()
      const newTrack = makeMockTrack('mic-2')
      const localStream = makeMockStream([makeMockTrack()])
      mockCallState.p2pCallState = makeMockP2PCallState({
        localStream,
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{ sender: { replaceTrack } }])
        }
      })
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([newTrack]))

      await deviceService.switchAudioDevice('mic-2')

      expect(replaceTrack).toHaveBeenCalledWith(newTrack)
      expect(mockDeviceState.setSelectedAudioDeviceId).toHaveBeenCalledWith('mic-2')
    })

    it('does nothing when p2pCallState is null', async () => {
      mockCallState.p2pCallState = null

      await deviceService.switchAudioDevice('mic-2')

      expect(mockMediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(mockDeviceState.setSelectedAudioDeviceId).not.toHaveBeenCalled()
    })

    it('does nothing when peerConnection is null', async () => {
      mockCallState.p2pCallState = makeMockP2PCallState({ peerConnection: null })

      await deviceService.switchAudioDevice('mic-2')

      expect(mockDeviceState.setSelectedAudioDeviceId).not.toHaveBeenCalled()
    })
  })
})

describe('DeviceService.switchVideoDevice', () => {
  describe('group call', () => {
    it('replaces track on the video producer', async () => {
      const videoProducer = makeMockProducer()
      const localStream = makeMockStream([], [makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: null, videoProducer }
      })
      const newTrack = makeMockTrack('cam-2')
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([], [newTrack]))

      await deviceService.switchVideoDevice('cam-2')

      expect(videoProducer.replaceTrack).toHaveBeenCalledWith({ track: newTrack })
      expect(mockDeviceState.setSelectedVideoDeviceId).toHaveBeenCalledWith('cam-2')
    })

    it('swaps the track in localStream', async () => {
      const oldTrack = makeMockTrack('old-cam')
      const newTrack = makeMockTrack('cam-2')
      const localStream = makeMockStream([], [oldTrack])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: null, videoProducer: makeMockProducer() }
      })
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([], [newTrack]))

      await deviceService.switchVideoDevice('cam-2')

      expect(localStream.removeTrack as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(oldTrack)
      expect(oldTrack.stop as ReturnType<typeof vi.fn>).toHaveBeenCalled()
      expect(localStream.addTrack as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(newTrack)
    })

    it('skips replaceTrack when videoProducer is null', async () => {
      const localStream = makeMockStream([], [makeMockTrack()])
      mockCallState.groupCallState = makeMockGroupCallState({
        session: { localStream, audioProducer: null, videoProducer: null }
      })

      await deviceService.switchVideoDevice('cam-2')

      expect(mockDeviceState.setSelectedVideoDeviceId).toHaveBeenCalledWith('cam-2')
    })

    it('does nothing when session is null', async () => {
      mockCallState.groupCallState = makeMockGroupCallState({ session: null })

      await deviceService.switchVideoDevice('cam-2')

      expect(mockMediaDevices.getUserMedia).not.toHaveBeenCalled()
      expect(mockDeviceState.setSelectedVideoDeviceId).not.toHaveBeenCalled()
    })
  })

  describe('P2P call', () => {
    it('replaces track on the second transceiver when video is enabled', async () => {
      const replaceTrack = vi.fn()
      const newTrack = makeMockTrack('cam-2')
      const localStream = makeMockStream([], [makeMockTrack()])
      mockCallState.p2pCallState = makeMockP2PCallState({
        localStream,
        isVideoEnabled: true,
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{}, { sender: { replaceTrack } }])
        }
      })
      mockMediaDevices.getUserMedia.mockResolvedValue(makeMockStream([], [newTrack]))

      await deviceService.switchVideoDevice('cam-2')

      expect(replaceTrack).toHaveBeenCalledWith(newTrack)
      expect(mockDeviceState.setSelectedVideoDeviceId).toHaveBeenCalledWith('cam-2')
    })

    it('skips replaceTrack when video is not enabled', async () => {
      const replaceTrack = vi.fn()
      const localStream = makeMockStream([], [makeMockTrack()])
      mockCallState.p2pCallState = makeMockP2PCallState({
        localStream,
        isVideoEnabled: false,
        peerConnection: {
          getTransceivers: vi.fn().mockReturnValue([{}, { sender: { replaceTrack } }])
        }
      })

      await deviceService.switchVideoDevice('cam-2')

      expect(replaceTrack).not.toHaveBeenCalled()
      expect(mockDeviceState.setSelectedVideoDeviceId).toHaveBeenCalledWith('cam-2')
    })

    it('does nothing when p2pCallState is null', async () => {
      mockCallState.p2pCallState = null

      await deviceService.switchVideoDevice('cam-2')

      expect(mockDeviceState.setSelectedVideoDeviceId).not.toHaveBeenCalled()
    })
  })
})

describe('DeviceService.enumerateDevices (inferSelectedDevices)', () => {
  beforeEach(() => {
    mockMediaDevices.enumerateDevices.mockResolvedValue([
      { kind: 'audioinput', deviceId: 'mic-1', label: 'Mic 1' } as MediaDeviceInfo,
      { kind: 'videoinput', deviceId: 'cam-1', label: 'Cam 1' } as MediaDeviceInfo
    ])
    mockDeviceState.selectedAudioDeviceId = undefined
    mockDeviceState.selectedVideoDeviceId = undefined
  })

  it('infers selected audio device from group call session localStream', async () => {
    const audioTrack = makeMockTrack('mic-1')
    const localStream = makeMockStream([audioTrack])
    mockCallState.groupCallState = {
      session: { localStream, audioProducer: null, videoProducer: null }
    }

    await deviceService.enumerateDevices()

    expect(mockDeviceState.setSelectedAudioDeviceId).toHaveBeenCalledWith('mic-1')
  })

  it('infers selected video device from group call session localStream', async () => {
    const videoTrack = makeMockTrack('cam-1')
    const localStream = makeMockStream([], [videoTrack])
    mockCallState.groupCallState = {
      session: { localStream, audioProducer: null, videoProducer: null }
    }

    await deviceService.enumerateDevices()

    expect(mockDeviceState.setSelectedVideoDeviceId).toHaveBeenCalledWith('cam-1')
  })

  it('infers selected audio device from P2P call localStream', async () => {
    const audioTrack = makeMockTrack('mic-1')
    mockCallState.p2pCallState = makeMockP2PCallState({
      localStream: makeMockStream([audioTrack])
    })

    await deviceService.enumerateDevices()

    expect(mockDeviceState.setSelectedAudioDeviceId).toHaveBeenCalledWith('mic-1')
  })

  it('does not infer devices when no call is active', async () => {
    mockCallState.p2pCallState = null
    mockCallState.groupCallState = null

    await deviceService.enumerateDevices()

    expect(mockDeviceState.setSelectedAudioDeviceId).not.toHaveBeenCalled()
    expect(mockDeviceState.setSelectedVideoDeviceId).not.toHaveBeenCalled()
  })

  it('does not overwrite an already-selected audio device', async () => {
    mockDeviceState.selectedAudioDeviceId = 'already-selected'
    const audioTrack = makeMockTrack('mic-1')
    mockCallState.groupCallState = {
      session: {
        localStream: makeMockStream([audioTrack]),
        audioProducer: null,
        videoProducer: null
      }
    }

    await deviceService.enumerateDevices()

    expect(mockDeviceState.setSelectedAudioDeviceId).not.toHaveBeenCalled()
  })
})

describe('DeviceService.startListening / stopListening', () => {
  it('registers a devicechange listener on start', () => {
    deviceService.startListening()

    expect(mockMediaDevices.addEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    )
  })

  it('removes the listener on stop', () => {
    deviceService.startListening()
    deviceService.stopListening()

    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledWith(
      'devicechange',
      expect.any(Function)
    )
  })

  it('removes old listener before adding new one on repeated startListening', () => {
    deviceService.startListening()
    deviceService.startListening()

    expect(mockMediaDevices.removeEventListener).toHaveBeenCalledTimes(1)
    expect(mockMediaDevices.addEventListener).toHaveBeenCalledTimes(2)
  })
})

describe('DeviceService.cleanup', () => {
  it('clears device state', () => {
    deviceService.cleanup()

    expect(mockDeviceState.clear).toHaveBeenCalled()
  })
})
