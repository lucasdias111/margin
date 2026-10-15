import { deviceState } from '$src/states/DeviceState.svelte'
import { callState } from '$src/states/CallState.svelte'
import { errorService } from '$src/services/ErrorService'

export const DEFAULT_DEVICE_ID = 'default'

export function defaultDeviceConstraint(
  base: MediaTrackConstraints | boolean = true
): MediaTrackConstraints {
  const constraints = typeof base === 'object' ? { ...base } : {}
  constraints.deviceId = { exact: DEFAULT_DEVICE_ID }
  return constraints
}

export async function getUserMediaPreferringDefault(
  preferred: MediaStreamConstraints,
  fallback: MediaStreamConstraints
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(preferred)
  } catch (err) {
    if (err instanceof Error && err.name === 'OverconstrainedError') {
      return navigator.mediaDevices.getUserMedia(fallback)
    }
    throw err
  }
}

class DeviceService {
  private boundOnDeviceChange: (() => void) | null = null

  async enumerateDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioInputs = devices
        .filter((d) => d.kind === 'audioinput' && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`
        }))

      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`
        }))

      deviceState.setAudioInputs(audioInputs)
      deviceState.setVideoInputs(videoInputs)

      this.inferSelectedDevices()
    } catch (err) {
      errorService.reportError(`Failed to enumerate devices: ${err}`)
    }
  }

  startListening(): void {
    this.stopListening()
    this.boundOnDeviceChange = () => this.enumerateDevices()
    navigator.mediaDevices.addEventListener('devicechange', this.boundOnDeviceChange)
  }

  stopListening(): void {
    if (this.boundOnDeviceChange) {
      navigator.mediaDevices.removeEventListener('devicechange', this.boundOnDeviceChange)
      this.boundOnDeviceChange = null
    }
  }

  async switchAudioDevice(deviceId: string): Promise<void> {
    const group = callState.groupCallState
    if (group) {
      const session = group.session
      if (!session) return
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } }
        })
        const newTrack = newStream.getAudioTracks()[0]
        if (!newTrack) return

        if (session.audioProducer) {
          await session.audioProducer.replaceTrack({ track: newTrack })
        }
        const oldTrack = session.localStream.getAudioTracks()[0]
        if (oldTrack) {
          session.localStream.removeTrack(oldTrack)
          oldTrack.stop()
        }
        session.localStream.addTrack(newTrack)
        newTrack.enabled = group.isAudioEnabled
        deviceState.setSelectedAudioDeviceId(deviceId)
      } catch (err) {
        errorService.reportError(`Failed to switch microphone: ${err}`)
      }
      return
    }

    const p2p = callState.p2pCallState
    if (!p2p?.peerConnection || !p2p.localStream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      })
      const newTrack = newStream.getAudioTracks()[0]
      if (!newTrack) return

      const oldTrack = p2p.localStream.getAudioTracks()[0]

      const transceiver = p2p.peerConnection.getTransceivers()[0]
      await transceiver.sender.replaceTrack(newTrack)

      if (oldTrack) {
        p2p.localStream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      p2p.localStream.addTrack(newTrack)

      newTrack.enabled = p2p.isAudioEnabled
      deviceState.setSelectedAudioDeviceId(deviceId)
    } catch (err) {
      errorService.reportError(`Failed to switch microphone: ${err}`)
    }
  }

  async switchVideoDevice(deviceId: string): Promise<void> {
    const group = callState.groupCallState
    if (group) {
      const session = group.session
      if (!session) return
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        })
        const newTrack = newStream.getVideoTracks()[0]
        if (!newTrack) return

        if (session.videoProducer) {
          await session.videoProducer.replaceTrack({ track: newTrack })
        }
        const oldTrack = session.localStream.getVideoTracks()[0]
        if (oldTrack) {
          session.localStream.removeTrack(oldTrack)
          oldTrack.stop()
        }
        session.localStream.addTrack(newTrack)
        deviceState.setSelectedVideoDeviceId(deviceId)
      } catch (err) {
        errorService.reportError(`Failed to switch camera: ${err}`)
      }
      return
    }

    const p2p = callState.p2pCallState
    if (!p2p?.peerConnection || !p2p.localStream) return

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      })
      const newTrack = newStream.getVideoTracks()[0]
      if (!newTrack) return

      const oldTrack = p2p.localStream.getVideoTracks()[0]

      const transceiver = p2p.peerConnection.getTransceivers()[1]
      if (p2p.isVideoEnabled) {
        await transceiver.sender.replaceTrack(newTrack)
      }

      if (oldTrack) {
        p2p.localStream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      p2p.localStream.addTrack(newTrack)

      deviceState.setSelectedVideoDeviceId(deviceId)
    } catch (err) {
      errorService.reportError(`Failed to switch camera: ${err}`)
    }
  }

  cleanup(): void {
    this.stopListening()
    deviceState.clear()
  }

  private inferSelectedDevices(): void {
    const localStream =
      callState.p2pCallState?.localStream ?? callState.groupCallState?.session?.localStream

    if (!deviceState.selectedAudioDeviceId) {
      if (deviceState.audioInputs.some((d) => d.deviceId === DEFAULT_DEVICE_ID)) {
        deviceState.setSelectedAudioDeviceId(DEFAULT_DEVICE_ID)
      } else {
        const deviceId = localStream?.getAudioTracks()[0]?.getSettings().deviceId
        if (deviceId) deviceState.setSelectedAudioDeviceId(deviceId)
      }
    }

    if (!deviceState.selectedVideoDeviceId) {
      if (deviceState.videoInputs.some((d) => d.deviceId === DEFAULT_DEVICE_ID)) {
        deviceState.setSelectedVideoDeviceId(DEFAULT_DEVICE_ID)
      } else {
        const deviceId = localStream?.getVideoTracks()[0]?.getSettings().deviceId
        if (deviceId) deviceState.setSelectedVideoDeviceId(deviceId)
      }
    }
  }
}

export const deviceService = new DeviceService()
