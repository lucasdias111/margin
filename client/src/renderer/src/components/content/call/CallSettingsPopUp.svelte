<script lang="ts">
  import { clickOutside } from '$src/actions/clickOutside'
  import { deviceState } from '$src/states/DeviceState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { deviceService } from '$src/services/DeviceService'
  import { callState } from '$src/states/CallState.svelte'
  import { channelCallService } from '$src/services/call/ChannelCallService'

  interface Props {
    onClose: () => void
  }

  let { onClose }: Props = $props()

  const QUALITY_OPTIONS = [
    { label: '360p', height: 360 },
    { label: '480p', height: 480 },
    { label: '720p', height: 720 },
    { label: '1080p', height: 1080 }
  ]

  const session = $derived(callState.groupCallState?.session ?? null)
  const availableQualities = QUALITY_OPTIONS

  function handleAudioChange(e: Event): void {
    const deviceId = (e.currentTarget as HTMLSelectElement).value
    deviceService.switchAudioDevice(deviceId)
  }

  function handleVideoChange(e: Event): void {
    const deviceId = (e.currentTarget as HTMLSelectElement).value
    deviceService.switchVideoDevice(deviceId)
  }

  function handleVideoQualityChange(e: Event): void {
    const value = (e.currentTarget as HTMLSelectElement).value
    channelCallService.setVideoQuality(value === '' ? null : Number(value))
  }

  function handleScreenQualityChange(e: Event): void {
    const value = (e.currentTarget as HTMLSelectElement).value
    channelCallService.setScreenShareQuality(value === '' ? null : Number(value))
  }
</script>

<div class="popover" use:clickOutside={onClose}>
  <div class="popover-header">
    <span>Settings</span>
    <button class="close-btn" onclick={onClose}>
      <Icon name="x" size={16} />
    </button>
  </div>

  {#if deviceState.audioInputs.length > 0}
    <div class="device-group">
      <label class="device-label">Microphone</label>
      <select
        class="device-select"
        value={deviceState.selectedAudioDeviceId ?? ''}
        onchange={handleAudioChange}
      >
        {#each deviceState.audioInputs as device (device.deviceId)}
          <option value={device.deviceId}>{device.label}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if deviceState.videoInputs.length > 0}
    <div class="device-group">
      <label class="device-label">Camera</label>
      <select
        class="device-select"
        value={deviceState.selectedVideoDeviceId ?? ''}
        onchange={handleVideoChange}
      >
        {#each deviceState.videoInputs as device (device.deviceId)}
          <option value={device.deviceId}>{device.label}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if session !== null}
    <div class="device-group">
      <label class="device-label">Camera Quality</label>
      <select
        class="device-select"
        value={session.preferredVideoHeight ?? ''}
        onchange={handleVideoQualityChange}
      >
        <option value="">Auto</option>
        {#each availableQualities as option (option.height)}
          <option value={option.height}>{option.label}</option>
        {/each}
      </select>
    </div>

    <div class="device-group">
      <label class="device-label">Screen Share Quality</label>
      <select
        class="device-select"
        value={session.preferredScreenHeight ?? ''}
        onchange={handleScreenQualityChange}
      >
        <option value="">Auto</option>
        {#each availableQualities as option (option.height)}
          <option value={option.height}>{option.label}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if deviceState.audioInputs.length === 0 && deviceState.videoInputs.length === 0 && session === null}
    <p class="no-devices">No devices found</p>
  {/if}
</div>

<style>
  .popover {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 12px;
    background: rgba(30, 30, 30, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    padding: 16px;
    min-width: 280px;
    z-index: 40;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }

  .popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .popover-header span {
    font-size: 14px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: white;
  }

  .device-group {
    margin-bottom: 12px;
  }

  .device-group:last-child {
    margin-bottom: 0;
  }

  .device-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 6px;
  }

  .device-select {
    width: 100%;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    appearance: none;
    transition: border-color 0.2s;
  }

  .device-select:hover {
    border-color: rgba(255, 255, 255, 0.25);
  }

  .device-select:focus {
    border-color: #b47024;
  }

  .device-select option {
    background: #2d2d2d;
    color: white;
  }

  .no-devices {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    padding: 8px 0;
  }
</style>
