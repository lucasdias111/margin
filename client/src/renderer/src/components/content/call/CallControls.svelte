<script lang="ts">
  import { formatDuration } from '$src/utils/DateUtils'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import CallSettingsPopUp from '$src/components/content/call/CallSettingsPopUp.svelte'

  interface Props {
    isAudioEnabled: boolean
    isVideoEnabled: boolean
    isScreenSharing: boolean
    isRemoteScreenSharing: boolean
    callTitle: string
    status: string
    duration: number
    showDuration?: boolean
    onMinimize: () => void
    onToggleAudio: () => void
    onToggleVideo: () => void
    onToggleScreenShare: () => void
    onEndCall: () => void
  }

  let {
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isRemoteScreenSharing,
    callTitle,
    status,
    duration,
    onMinimize,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onEndCall,
    showDuration = true
  }: Props = $props()

  let settingsOpen = $state(false)
</script>

<div class="floating-bar">
  <div class="call-info">
    <h2>{callTitle}</h2>
    {#if showDuration}
      {#if status === 'connected'}
        <p class="duration">{formatDuration(duration)}</p>
      {:else}
        <p class="duration">Connecting...</p>
      {/if}
    {/if}
  </div>

  <div class="call-buttons">
    <button class="control-btn minimize-btn" onclick={onMinimize} title="Minimize">
      <Icon name="minimize" size={20} strokeWidth={2.5} />
    </button>

    <button
      class="control-btn toggle-audio-btn"
      class:muted={!isAudioEnabled}
      onclick={onToggleAudio}
      title="Toggle Microphone"
    >
      <Icon name={isAudioEnabled ? 'mic_off' : 'mic'} />
    </button>

    <button
      class="control-btn toggle-video-btn"
      class:muted={!isVideoEnabled}
      onclick={onToggleVideo}
      title="Toggle Video"
    >
      <Icon name={isVideoEnabled ? 'video_off' : 'video'} />
    </button>

    <button
      class="control-btn toggle-screenshare-btn"
      class:active={isScreenSharing}
      onclick={onToggleScreenShare}
      disabled={isRemoteScreenSharing}
      title="Share Screen"
    >
      <Icon name="monitor" />
    </button>

    <div class="settings-anchor">
      <button
        class="control-btn settings-btn"
        class:active={settingsOpen}
        onclick={() => (settingsOpen = !settingsOpen)}
        title="Settings"
      >
        <Icon name="settings" size={20} strokeWidth={2.5} />
      </button>

      {#if settingsOpen}
        <CallSettingsPopUp onClose={() => (settingsOpen = false)} />
      {/if}
    </div>

    <button class="control-btn end-call-btn" onclick={onEndCall} title="End Call">
      <Icon name="phone_off" />
    </button>
  </div>
</div>

<style>
  .floating-bar {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    padding: 12px 24px;
    background: rgba(30, 30, 30, 0.7);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0.5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .floating-bar:hover {
    opacity: 1;
    background: rgba(40, 40, 40, 0.9);
    transform: translateX(-50%) translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .call-info {
    text-align: center;
  }

  .call-info h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: white;
  }

  .duration {
    margin: 4px 0 0 0;
    font-size: 14px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
  }

  .call-buttons {
    display: flex;
    gap: 16px;
  }

  .settings-anchor {
    position: relative;
  }

  .control-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
  }

  .minimize-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .minimize-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .settings-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .settings-btn.active {
    background: #b47024;
  }

  .toggle-audio-btn,
  .toggle-video-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .toggle-audio-btn:hover,
  .toggle-video-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .control-btn.muted {
    background: rgba(220, 53, 69, 0.6);
  }

  .control-btn.muted:hover {
    background: rgba(220, 53, 69, 0.75);
  }

  .end-call-btn {
    background: #dc3545;
  }

  .end-call-btn:hover {
    background: #ff4d5e;
    transform: scale(1.1);
  }

  .end-call-btn:active {
    transform: scale(0.95);
  }

  .toggle-screenshare-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .toggle-screenshare-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .toggle-screenshare-btn.active {
    background: #b47024;
  }

  .toggle-screenshare-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
