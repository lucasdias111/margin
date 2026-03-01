<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import hangUpCallIcon from '$src/resources/hangUpCall.png'
  import UserAvatar from '../user/UserAvatar.svelte'
  import { chatState } from '$src/states/ChatState.svelte'

  interface Props {
    name: string

    handleStartCall(): void

    handleStartVideoCall(): void

    isInCall?: boolean

    onToggleSidebar?(): void

    sidebarOpen?: boolean
  }

  let {
    name,
    handleStartVideoCall,
    handleStartCall,
    isInCall = false,
    onToggleSidebar,
    sidebarOpen = true
  }: Props = $props()
</script>

<div>
  <div class="chat-header">
    <div class="header-content">
      {#if !chatState.selectedChannel}
        <UserAvatar
          profilePictureUrl={chatState.selectedUser.profilePictureUrl}
          width={32}
          height={32}
        />
      {/if}

      <div class="user-info">
        <span class="username">{name}</span>
        <span class="status">Offline</span>
      </div>
    </div>

    <div class="header-actions">
      {#if onToggleSidebar}
        <button
          class="action-btn"
          class:active={sidebarOpen}
          onclick={onToggleSidebar}
          title="Channel info"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
      {/if}

      {#if !chatState.selectedChannel}
        <div class="call-buttons">
          <button
            class="call-btn"
            class:active-call={isInCall}
            onclick={handleStartCall}
            title={isInCall ? 'Leave voice call' : 'Voice call'}
          >
            {#if isInCall}
              <img src={hangUpCallIcon} alt="Hang up call" />
            {:else}
              <img src={voiceCallIcon} alt="Voice call" />
            {/if}
          </button>
          <button class="call-btn" onclick={handleStartVideoCall} title="Video call">
            <img src={videoCallIcon} alt="Video call" />
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .username {
    color: #2d2d2d;
    font-size: 1.3rem;
    font-weight: 600;
  }

  .chat-header {
    height: 80px;
    background-color: #f8ebd2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: none;
    border-radius: 15px;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    color: #f47e3a;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .status {
    font-size: 0.75rem;
    color: #f47e3a;
  }

  .call-buttons {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #da6b10;
    transition: background-color 0.2s,
    color 0.2s;
  }

  .action-btn:hover {
    background-color: rgba(218, 107, 16, 0.12);
  }

  .action-btn.active {
    background-color: rgba(218, 107, 16, 0.18);
    color: #da6b10;
  }

  .call-btn {
    background: #f47e3a;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .call-btn:hover {
    background-color: #2a2a2a;
  }

  .call-btn:active {
    background-color: #3a3a3a;
  }

  .call-btn.active-call {
    background-color: #dc3545;
  }

  .call-btn.active-call:hover {
    background-color: #c82333;
  }

  .call-btn img {
    width: 24px;
    height: 24px;
    display: block;
  }
</style>
