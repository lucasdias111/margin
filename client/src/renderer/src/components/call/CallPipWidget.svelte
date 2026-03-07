<script lang="ts">
  import { callState } from '$src/states/CallState.svelte'
  import { callService } from '$src/services/CallService'
  import { formatDuration } from '$src/utils/DateUtils'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'

  interface Props {
    remoteVideoStream: MediaStream | null
    screenShareStream: MediaStream | null
    onRestore: () => void
  }

  let { remoteVideoStream, screenShareStream, onRestore }: Props = $props()

  let pipX = $state(window.innerWidth - 320)
  let pipY = $state(window.innerHeight - 220)
  let dragging = $state(false)
  let dragOffsetX = 0
  let dragOffsetY = 0

  function onPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('button')) return
    dragging = true
    dragOffsetX = e.clientX - pipX
    dragOffsetY = e.clientY - pipY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!dragging) return
    pipX = Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffsetX))
    pipY = Math.max(0, Math.min(window.innerHeight - 180, e.clientY - dragOffsetY))
  }

  function onPointerUp(): void {
    dragging = false
  }
</script>

{#if callState.p2pCallState}
  <div
    class="pip-widget"
    style:left="{pipX}px"
    style:top="{pipY}px"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onlostpointercapture={() => {
      dragging = false
    }}
    role="region"
    aria-label="Active call"
  >
    <div class="pip-video-area">
      {#if callState.p2pCallState.isRemoteScreenSharing && screenShareStream}
        <video srcobject={screenShareStream} autoplay playsinline class="pip-video"></video>
      {:else if callState.p2pCallState.isRemoteVideoEnabled && remoteVideoStream}
        <video srcobject={remoteVideoStream} autoplay playsinline class="pip-video"></video>
      {:else}
        <div class="pip-avatar">
          <UserAvatar
            profilePictureUrl={callState.p2pCallState.user.profilePictureUrl}
            width={64}
            height={64}
          />
          <p class="pip-username">{callState.p2pCallState.user.displayName}</p>
        </div>
      {/if}
    </div>

    <div class="pip-overlay">
      <span class="pip-duration">
        {#if callState.status === 'connected'}
          {formatDuration(callState.duration)}
        {:else}
          {callState.status}...
        {/if}
      </span>
      <div class="pip-actions">
        <button class="pip-btn restore-btn" onclick={onRestore} title="Restore call">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <button class="pip-btn end-btn" onclick={() => callService.endCall(false)} title="End call">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
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
  </div>
{/if}

<style>
  .pip-widget {
    position: fixed;
    width: 300px;
    height: 180px;
    border-radius: 16px;
    overflow: hidden;
    background: #1a1a1a;
    border: 1.5px solid rgba(180, 112, 36, 0.6);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    z-index: 1000;
    cursor: grab;
    user-select: none;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
  }

  .pip-widget:hover {
    border-color: #b47024;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.7),
      0 0 0 1px rgba(180, 112, 36, 0.3);
  }

  .pip-widget:active {
    cursor: grabbing;
  }

  .pip-video-area {
    width: 100%;
    height: 100%;
    background: #c1c1c1;
  }

  .pip-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pip-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: radial-gradient(circle at 50% 40%, #2a1f0f, #0d0d0d);
  }

  .pip-username {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
  }

  .pip-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 10px 12px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, transparent 55%);
    pointer-events: none;
  }

  .pip-duration {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.02em;
  }

  .pip-actions {
    display: flex;
    gap: 8px;
    pointer-events: all;
  }

  .pip-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    color: white;
    transition:
      transform 0.15s,
      background 0.15s;
  }

  .restore-btn {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
  }
  .restore-btn:hover {
    background: rgba(255, 255, 255, 0.28);
    transform: scale(1.1);
  }
  .end-btn {
    background: rgba(220, 53, 69, 0.85);
    backdrop-filter: blur(8px);
  }
  .end-btn:hover {
    background: #dc3545;
    transform: scale(1.1);
  }
</style>
