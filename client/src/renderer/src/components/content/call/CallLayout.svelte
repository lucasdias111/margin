<script lang="ts">
  import { srcObject } from '$src/actions/srcObject'
  import CallParticipantTile from '$src/components/content/call/CallParticipantTile.svelte'
  import CallControls from '$src/components/content/call/CallControls.svelte'
  import type { CallParticipant } from '$src/interfaces/Calls'

  interface Props {
    localParticipant: CallParticipant
    remoteParticipants: CallParticipant[]
    remoteScreenStream: MediaStream | null
    isAudioEnabled: boolean
    isVideoEnabled: boolean
    isScreenSharing: boolean
    isRemoteScreenSharing: boolean
    status: string
    duration: number
    showDuration?: boolean
    callTitle?: string
    forceGrid?: boolean
    onMinimize: () => void
    onToggleAudio: () => void
    onToggleVideo: () => void
    onToggleScreenShare: () => void
    onEndCall: () => void
  }

  let {
    localParticipant,
    remoteParticipants,
    remoteScreenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isRemoteScreenSharing,
    status,
    duration,
    showDuration = true,
    callTitle,
    forceGrid = false,
    onMinimize,
    onToggleAudio,
    onToggleVideo,
    onToggleScreenShare,
    onEndCall
  }: Props = $props()

  const PAGE_SIZE = 6
  let currentPage = $state(0)
  const isOneOnOne = $derived(!forceGrid && remoteParticipants.length === 1)
  const totalPages = $derived(Math.ceil(remoteParticipants.length / PAGE_SIZE))
  const visibleRemoteParticipants = $derived(
    remoteParticipants.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  )
  const gridCols = $derived(
    visibleRemoteParticipants.length <= 1 ? 1 : visibleRemoteParticipants.length <= 3 ? 2 : 3
  )
  const gridParticipants = $derived(
    isOneOnOne ? visibleRemoteParticipants : [...visibleRemoteParticipants, localParticipant]
  )
  const gridRows = $derived(Math.ceil(gridParticipants.length / gridCols))

  function prevPage(): void {
    if (currentPage > 0) currentPage--
  }

  function nextPage(): void {
    if (currentPage < totalPages - 1) currentPage++
  }
</script>

<div class="call-layout">
  {#if isOneOnOne}
    <div class="one-on-one">
      {#if isRemoteScreenSharing}
        <div class="screen-share-container">
          <video use:srcObject={remoteScreenStream} autoplay playsinline class="screen-share-video"
          ></video>
          {#if remoteParticipants[0].isVideoEnabled}
            <div class="remote-pip">
              <CallParticipantTile participant={remoteParticipants[0]} />
            </div>
          {/if}
        </div>
      {:else}
        <CallParticipantTile participant={remoteParticipants[0]} fullScreen />
      {/if}

      {#if localParticipant.isVideoEnabled}
        <div class="local-pip">
          <CallParticipantTile participant={localParticipant} />
        </div>
      {/if}
    </div>
  {:else}
    <div class="grid" style:--cols={gridCols} style:--rows={gridRows}>
      {#each gridParticipants as participant (participant.id)}
        <CallParticipantTile {participant} isLocal={participant.isLocal} />
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="pagination">
        <button onclick={prevPage} disabled={currentPage === 0}>←</button>
        <span>{currentPage + 1} / {totalPages}</span>
        <button onclick={nextPage} disabled={currentPage === totalPages - 1}>→</button>
      </div>
    {/if}
  {/if}

  <CallControls
    {isAudioEnabled}
    {isVideoEnabled}
    {isScreenSharing}
    {isRemoteScreenSharing}
    callTitle={callTitle ?? (isOneOnOne ? `Call with ${remoteParticipants[0]?.displayName}` : 'Group call')}
    {status}
    {duration}
    {onMinimize}
    {onToggleAudio}
    {onToggleVideo}
    {onToggleScreenShare}
    {onEndCall}
    {showDuration}
  />
</div>

<style>
  .call-layout {
    width: 100%;
    height: 100%;
    background: #2d2d2d;
    position: relative;
    overflow: hidden;
    color: white;
  }

  .one-on-one {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .screen-share-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .screen-share-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #1a1a1a;
  }

  .remote-pip {
    position: absolute;
    bottom: 110px;
    left: 30px;
    width: 240px;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #b47024;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 10;
  }

  .local-pip {
    position: fixed;
    bottom: 110px;
    right: 30px;
    width: 240px;
    aspect-ratio: 16/9;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid #b47024;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    background: #1a1a1a;
    z-index: 10;
  }

  .grid {
    position: absolute;
    inset: 0;
    padding: 16px 16px 120px;
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    grid-template-rows: repeat(var(--rows), 1fr);
    gap: 8px;
  }

  .pagination {
    position: absolute;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    color: white;
    font-size: 14px;
    z-index: 20;
  }

  .pagination button {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .pagination button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
  }

  .pagination button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
