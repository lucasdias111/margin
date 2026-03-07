<script lang="ts">
  import { callState } from '$src/states/CallState.svelte'
  import { callService } from '$src/services/CallService'
  import { formatDuration } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'

  interface Props {
    remoteVideo: HTMLVideoElement | null
    localVideo: HTMLVideoElement | null
    screenShareVideo: HTMLVideoElement | null
    onMinimize: () => void
  }

  let {
    remoteVideo = $bindable(),
    localVideo = $bindable(),
    screenShareVideo = $bindable(),
    onMinimize
  }: Props = $props()
</script>

{#if callState.p2pCallState}
  <div class="call-window">
    <div class="call-header overlay">
      <h2>Call with {callState.p2pCallState.user.displayName}</h2>
      {#if callState.status === 'connected'}
        <p class="duration">{formatDuration(callState.duration)}</p>
      {/if}
    </div>

    <div class="call-content full-screen">
      {#if callState.p2pCallState.isRemoteScreenSharing}
        <div class="video-container-full">
          <video bind:this={screenShareVideo} autoplay playsinline class="screen-share-video"
          ></video>
        </div>
        {#if callState.p2pCallState.isRemoteVideoEnabled}
          <div class="remote-video-pip">
            <video bind:this={remoteVideo} autoplay playsinline class="remote-video"></video>
          </div>
        {/if}
      {:else if callState.p2pCallState.isRemoteVideoEnabled}
        <div class="video-container-full">
          <video bind:this={remoteVideo} autoplay playsinline class="remote-video"></video>
        </div>
      {:else}
        <div class="user-avatar">
          <UserAvatar
            profilePictureUrl={callState.p2pCallState.user.profilePictureUrl}
            width={120}
            height={120}
          />
          <p class="username">{callState.p2pCallState.user.displayName}</p>
          <p class="status-text">{callState.status}...</p>
        </div>
      {/if}
    </div>

    {#if callState.p2pCallState.isVideoEnabled}
      <div class="local-video-container">
        <video bind:this={localVideo} autoplay playsinline muted class="local-video"></video>
      </div>
    {/if}

    <div class="call-controls floating-bar">
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

      <button
        class="control-btn toggle-video-btn"
        onclick={() => callService.toggleVideo()}
        title="Toggle Video"
      >
        {#if callState.p2pCallState.isVideoEnabled}
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
        class:active={callState.p2pCallState.isScreenSharing}
        onclick={() =>
          callState.p2pCallState?.isScreenSharing
            ? callService.stopScreenShare()
            : callService.startScreenShare()}
        disabled={callState.p2pCallState.isRemoteScreenSharing}
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

      <button
        class="control-btn end-call-btn"
        onclick={() => callService.endCall(false)}
        title="End Call"
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
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
            19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11
            2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45
            2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
            12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
          />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .call-window {
    width: 100%;
    height: 100%;
    background: #c1c1c1;
    position: relative;
    overflow: hidden;
    color: white;
  }

  .call-header.overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: 20px;
    text-align: center;
    background: #2d2d2d;
    pointer-events: none;
  }

  .call-header h2 {
    margin: 0;
    font-size: 20px;
    color: #ffffff;
  }
  .duration {
    margin: 5px 0 0 0;
    font-size: 18px;
    font-weight: 300;
  }

  .call-content.full-screen {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .video-container-full {
    width: 100%;
    height: 100%;
    background: #c1c1c1;
  }
  .remote-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .screen-share-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #2d2d2d;
  }

  .remote-video-pip {
    position: fixed;
    bottom: 110px;
    left: 30px;
    width: 240px;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #b47024;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    background: #c1c1c1;
    z-index: 10;
  }

  .local-video-container {
    position: fixed;
    bottom: 110px;
    right: 30px;
    width: 240px;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #b47024;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    background: #c1c1c1;
    z-index: 10;
  }

  .local-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-avatar {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .username {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: white;
  }
  .status-text {
    text-transform: capitalize;
    font-size: 18px;
    color: #888;
  }

  .call-controls.floating-bar {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    padding: 12px 24px;
    background: rgba(30, 30, 30, 0.7);
    backdrop-filter: blur(12px);
    border-radius: 100px;
    display: flex;
    gap: 16px;
    opacity: 0.5;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .call-controls.floating-bar:hover {
    opacity: 1;
    background: rgba(40, 40, 40, 0.9);
    transform: translateX(-50%) translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
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
  .toggle-video-btn,
  .toggle-screenshare-btn {
    background: rgba(255, 255, 255, 0.1);
  }
  .toggle-video-btn:hover,
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
</style>
