export interface AudioDevice {
  deviceId: string
  label: string
}

export interface VideoDevice {
  deviceId: string
  label: string
}

class DeviceState {
  audioInputs = $state<AudioDevice[]>([])
  videoInputs = $state<VideoDevice[]>([])
  selectedAudioDeviceId = $state<string | undefined>(undefined)
  selectedVideoDeviceId = $state<string | undefined>(undefined)

  setAudioInputs(devices: AudioDevice[]): void {
    this.audioInputs = devices
  }

  setVideoInputs(devices: VideoDevice[]): void {
    this.videoInputs = devices
  }

  setSelectedAudioDeviceId(deviceId: string): void {
    this.selectedAudioDeviceId = deviceId
  }

  setSelectedVideoDeviceId(deviceId: string): void {
    this.selectedVideoDeviceId = deviceId
  }

  clear(): void {
    this.audioInputs = []
    this.videoInputs = []
    this.selectedAudioDeviceId = undefined
    this.selectedVideoDeviceId = undefined
  }
}

export const deviceState = new DeviceState()
