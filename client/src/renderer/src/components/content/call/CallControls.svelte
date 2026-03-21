<script lang="ts">
  import { formatDuration } from '$src/utils/DateUtils'

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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="4 14 10 14 10 20" />
        <polyline points="20 10 14 10 14 4" />
        <line x1="10" y1="14" x2="3" y2="21" />
        <line x1="21" y1="3" x2="14" y2="10" />
      </svg>
    </button>

    <button class="control-btn toggle-audio-btn" onclick={onToggleAudio} title="Toggle Microphone">
      {#if isAudioEnabled}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      {/if}
    </button>

    <button class="control-btn toggle-video-btn" onclick={onToggleVideo} title="Toggle Video">
      {#if isVideoEnabled}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34" />
          <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
          <path d="M22 8l-6 4 6 4V8z" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      {/if}
    </button>

    <button
      class="control-btn toggle-screenshare-btn"
      class:active={isScreenSharing}
      onclick={onToggleScreenShare}
      disabled={isRemoteScreenSharing}
      title="Share Screen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    </button>

    <button class="control-btn end-call-btn" onclick={onEndCall} title="End Call">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
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

  .minimize-btn,
  .toggle-video-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .minimize-btn:hover,
  .toggle-video-btn:hover {
    background: rgba(255, 255, 255, 0.2);
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

  .toggle-audio-btn,
  .toggle-screenshare-btn {
    background: rgba(255, 255, 255, 0.1);
  }

  .toggle-audio-btn:hover,
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
