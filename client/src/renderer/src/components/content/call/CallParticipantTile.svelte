<script lang="ts">
  import type { CallParticipant } from '$src/types/call'
  import { srcObject } from '$src/actions/srcObject'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'

  interface Props {
    participant: CallParticipant
    isLocal?: boolean
    fullScreen?: boolean
  }

  let { participant, isLocal = false, fullScreen = false }: Props = $props()

  const displayStream = $derived(
    isLocal && participant.stream
      ? new MediaStream(participant.stream.getVideoTracks())
      : participant.stream
  )
</script>

<div class="tile" class:full-screen={fullScreen} class:is-local={isLocal}>
  {#if participant.stream && participant.isVideoEnabled}
    <video use:srcObject={displayStream} autoplay playsinline muted={isLocal} class="video"></video>
  {:else}
    <div class="avatar-fallback">
      <UserAvatar
        profilePictureUrl={participant.profilePictureUrl}
        width={fullScreen ? 120 : 64}
        height={fullScreen ? 120 : 64}
      />
      <p class="name">{participant.displayName}</p>
    </div>
  {/if}

  {#if isLocal}
    <span class="local-label">You</span>
  {/if}
</div>

<style>
  .tile {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 160px;
    background: #1e1e1e;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tile.full-screen {
    position: absolute;
    inset: 0;
    border-radius: 0;
    min-height: unset;
  }

  .tile.is-local {
    border: 2px solid #b47024;
  }

  .video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .name {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: white;
  }

  .local-label {
    position: absolute;
    bottom: 8px;
    left: 10px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
