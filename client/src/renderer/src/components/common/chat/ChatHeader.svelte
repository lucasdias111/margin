<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import hangUpCallIcon from '$src/resources/hangUpCall.png'
  import UserAvatar from '../user/UserAvatar.svelte'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { presenceState } from '$src/states/PresenceState.svelte'

  interface Props {
    userId: number
    name: string
    handleStartCall(): void
    handleStartVideoCall(): void
    isInCall?: boolean
    onToggleSidebar?(): void
    sidebarOpen?: boolean
  }

  let {
    userId,
    name,
    handleStartVideoCall,
    handleStartCall,
    isInCall = false,
    onToggleSidebar,
    sidebarOpen = true
  }: Props = $props()

  const isOnline = $derived(presenceState.isOnline(userId))
</script>

<div class="chat-header">
  <div class="header-left">
    {#if !chatState.selectedChannel}
      <div class="avatar-wrapper">
        <UserAvatar
          profilePictureUrl={chatState.selectedUser.profilePictureUrl}
          width={38}
          height={38}
        />
        <span class="presence-dot" class:online={isOnline}></span>
      </div>
      <div class="user-info">
        <span class="username">{name}</span>
        <span class="status-label" class:online={isOnline}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    {:else}
      <div class="channel-info">
        <span class="channel-hash">#</span>
        <span class="username">{name}</span>
      </div>
    {/if}
  </div>

  <div class="header-right">
    {#if !chatState.selectedChannel}
      <div class="call-group">
        <button
          class="call-btn"
          class:danger={isInCall}
          onclick={handleStartCall}
          title={isInCall ? 'Leave voice call' : 'Voice call'}
          aria-label={isInCall ? 'Leave voice call' : 'Start voice call'}
        >
          {#if isInCall}
            <img src={hangUpCallIcon} alt="" />
          {:else}
            <img src={voiceCallIcon} alt="" />
          {/if}
        </button>

        <div class="divider"></div>

        <button
          class="call-btn"
          onclick={handleStartVideoCall}
          title="Video call"
          aria-label="Start video call"
        >
          <img src={videoCallIcon} alt="" />
        </button>
      </div>
    {/if}

    {#if onToggleSidebar}
      <button
        class="icon-btn"
        class:active={sidebarOpen}
        onclick={onToggleSidebar}
        title="Toggle member list"
        aria-label="Toggle sidebar"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .chat-header {
    height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: #ffffff;
    border-bottom: 1px solid #f0ece6;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .presence-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c4c4c4;
    border: 2px solid #ffffff;
    transition: background 0.25s ease;
  }

  .presence-dot.online {
    background: #3ecf6e;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .username {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.01em;
    line-height: 1;
  }

  .status-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: #aaa;
    letter-spacing: 0.01em;
    line-height: 1;
    transition: color 0.25s ease;
  }

  .status-label.online {
    color: #3ecf6e;
  }

  .channel-info {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .channel-hash {
    font-size: 1.1rem;
    font-weight: 700;
    color: #e07a30;
    line-height: 1;
  }

  .call-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: 4px;
  }

  .divider {
    display: none;
  }

  .call-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: #f47e3a;
    cursor: pointer;
    transition:
      background 0.2s ease,
      transform 0.1s ease;
  }

  .call-btn:hover {
    background: #2a2a2a;
  }

  .call-btn:active {
    background: #3a3a3a;
    transform: scale(0.93);
  }

  .call-btn.danger {
    background: #dc3545;
  }

  .call-btn.danger:hover {
    background: #c82333;
  }

  .call-btn img {
    width: 20px;
    height: 20px;
    display: block;
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #aaa;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .icon-btn:hover {
    background: #f6f3ee;
    color: #555;
  }

  .icon-btn.active {
    background: #f0ebe1;
    color: #e07a30;
  }
</style>
