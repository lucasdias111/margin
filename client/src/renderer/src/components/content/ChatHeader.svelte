<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import hangUpCallIcon from '$src/resources/hangUpCall.png'
  import UserAvatar from '../user/UserAvatar.svelte';
  import { chatState } from '$src/states/ChatState.svelte'

  interface Props {
    name: string
    handleStartCall(): void
    handleStartVideoCall(): void
    isInCall?: boolean
  }

  let { name, handleStartVideoCall, handleStartCall, isInCall = false }: Props = $props()
</script>

<div>
  <div class="chat-header">
    <div class="header-content">
      <UserAvatar
    profilePictureUrl={chatState.selectedUser.profilePictureUrl}
    width={32}
    height={32}
    />

    <div class="user-info">
    <span class="username">{name}</span>
    <span class="status">Offline</span>
    </div>
    </div>
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
  </div>
</div>

<style>
  .chat-header {
    height: 80px;
    background-color: #f8ebd2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0px 12px;
    border-bottom: none;
    border-radius: 15px;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    color: #da6b10;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .status {
    font-size: 0.75rem;
    color: #da6b10;
  }

  .call-buttons {
    display: flex;
    gap: 12px;

  }

  .call-btn {
    background: #da6b10;
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
