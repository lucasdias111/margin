<script lang="ts">
  import voiceCallIcon from '$src/resources/voiceCall.png'
  import videoCallIcon from '$src/resources/videoCall.png'
  import ChatHeaderShell from '$src/components/common/chat/ChatHeaderShell.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { usersState } from '$src/states/UsersState.svelte'

  interface Props {
    handleStartCall(): void
    handleStartVideoCall(): void

    isLoading?: boolean
  }

  let { handleStartCall, handleStartVideoCall, isLoading = false }: Props = $props()

  const isOnline = $derived(usersState.byId.get(navigationState.selectedUser.id).isOnline ?? false)
  const selectedUser = $derived(usersState.byId.get(navigationState.selectedUser.id))
</script>

<ChatHeaderShell {isLoading}>
  {#snippet left()}
    <div class="avatar-wrapper">
      <UserAvatar profilePictureUrl={selectedUser.profilePictureUrl} width={38} height={38} />
      <span class="presence-dot" class:online={isOnline}></span>
    </div>
    <div class="user-info">
      <span class="handle">{selectedUser.displayName}</span>
      <span class="status-label" class:online={isOnline}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  {/snippet}

  {#snippet right()}
    <div class="call-group">
      <button
        class="call-btn"
        onclick={handleStartCall}
        title="Voice call"
        aria-label="Start voice call"
      >
        <img src={voiceCallIcon} alt="" />
      </button>

      <button
        class="call-btn"
        onclick={handleStartVideoCall}
        title="Video call"
        aria-label="Start video call"
      >
        <img src={videoCallIcon} alt="" />
      </button>
    </div>
  {/snippet}
</ChatHeaderShell>

<style>
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

  .handle {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.01em;
    line-height: 1.5;
  }

  .status-label {
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
    letter-spacing: 0.01em;
    line-height: 1;
    transition: color 0.25s ease;
  }

  .status-label.online {
    color: #3ecf6e;
  }

  .call-group {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: 4px;
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

  .call-btn img {
    width: 20px;
    height: 20px;
    display: block;
  }
</style>
