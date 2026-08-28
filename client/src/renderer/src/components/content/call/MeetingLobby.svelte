<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { srcObject } from '$src/actions/srcObject'
  import { meetingGuestService, type MeetingPreview } from '$src/services/MeetingGuestService'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  const {
    code,
    onAdmitted,
    onKnocked
  }: {
    code: string
    onAdmitted: () => void
    onKnocked: () => void
  } = $props()

  type Phase = 'loading' | 'lobby' | 'joining' | 'unavailable'

  let phase = $state<Phase>('loading')
  let preview = $state<MeetingPreview | null>(null)
  let displayName = $state('')
  let message = $state('')
  let localStream = $state<MediaStream | null>(null)
  let micOn = $state(true)
  let cameraOn = $state(false)

  onMount(async () => {
    preview = await meetingGuestService.preview(code)

    if (!preview) {
      phase = 'unavailable'
      message = 'This meeting link is not valid.'
      return
    }
    if (!preview.joinable) {
      phase = 'unavailable'
      message = 'This meeting has already ended.'
      return
    }

    phase = 'lobby'
    await startPreviewStream()
  })

  onDestroy(() => stopPreviewStream())

  async function startPreviewStream(): Promise<void> {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      message = 'We could not reach your microphone. You can still join and fix it later.'
    }
  }

  function stopPreviewStream(): void {
    localStream?.getTracks().forEach((t) => t.stop())
    localStream = null
  }

  async function toggleCamera(): Promise<void> {
    if (cameraOn) {
      localStream?.getVideoTracks().forEach((t) => {
        t.stop()
        localStream?.removeTrack(t)
      })
      cameraOn = false
      localStream = localStream
      return
    }

    try {
      const video = await navigator.mediaDevices.getUserMedia({ video: true })
      video.getVideoTracks().forEach((t) => localStream?.addTrack(t))
      cameraOn = true
      localStream = localStream
    } catch {
      message = 'We could not reach your camera.'
    }
  }

  function toggleMic(): void {
    micOn = !micOn
    localStream?.getAudioTracks().forEach((t) => (t.enabled = micOn))
  }

  function goBack(): void {
    stopPreviewStream()
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    window.location.hash = '#/'
  }

  async function joinAsGuest(): Promise<void> {
    if (phase === 'joining') return
    phase = 'joining'

    const session = await meetingGuestService.startSession(code, displayName.trim())
    if (!session) {
      phase = 'lobby'
      message = 'We could not join you to this meeting. Try again in a moment.'
      return
    }

    stopPreviewStream()
    if (session.requiresAdmission) {
      onKnocked()
    } else {
      onAdmitted()
    }
  }
</script>

<div class="lobby">
  <button class="back-btn" onclick={goBack} aria-label="Back" title="Back">
    <Icon name="chevronLeft" size={22} color="#1a1a1a" strokeWidth={2.5} />
  </button>

  {#if phase === 'loading'}
    <p class="muted">Loading…</p>
  {:else if phase === 'unavailable'}
    <h1 class="title">Meeting unavailable</h1>
    <p class="muted">{message}</p>
  {:else}
    <h1 class="title">{preview?.title || 'Meeting'}</h1>
    <p class="muted">
      {preview?.hostDisplayName} invited you · {preview?.marginName}
    </p>

    <div class="stage">
      {#if cameraOn && localStream}
        <video use:srcObject={localStream} autoplay playsinline muted class="preview"></video>
      {:else}
        <div class="preview placeholder">
          <span>{(displayName.trim() || 'You').charAt(0).toUpperCase()}</span>
        </div>
      {/if}
    </div>

    <div class="device-row">
      <Button
        buttonType={micOn ? 'secondary' : 'list'}
        size="small"
        text={micOn ? 'Mic on' : 'Mic off'}
        onClick={toggleMic}
      />
      <Button
        buttonType={cameraOn ? 'secondary' : 'list'}
        size="small"
        text={cameraOn ? 'Camera on' : 'Camera off'}
        onClick={toggleCamera}
      />
    </div>

    <label class="field">
      <span class="field-label">Your name</span>
      <input type="text" bind:value={displayName} placeholder="Guest" maxlength="50" />
    </label>

    {#if message}
      <p class="muted">{message}</p>
    {/if}

    <Button
      buttonType="primary"
      size="large"
      fullWidth
      disabled={phase === 'joining'}
      text={phase === 'joining' ? 'Joining…' : 'Join as guest'}
      onClick={joinAsGuest}
    />

    <p class="muted small">
      {preview?.requireAdmission
        ? 'The host will let you in.'
        : 'You will join the meeting straight away.'}
    </p>
  {/if}
</div>

<style>
  .lobby {
    position: relative;
    color: #2d2d2d;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background-color: #f2eee8;
  }

  .back-btn {
    color: #1a1a1a;
    position: absolute;
    top: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 50%;
    background: white;
    cursor: pointer;
  }

  .back-btn:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  .title {
    margin: 0;
    font-size: 22px;
  }

  .muted {
    margin: 0;
    font-size: 13px;
    opacity: 0.75;
    text-align: center;
  }

  .small {
    font-size: 12px;
  }

  .stage {
    width: 320px;
    height: 200px;
    border-radius: 10px;
    overflow: hidden;
    background: #1d1d1f;
  }

  .preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 42px;
  }

  .device-row {
    display: flex;
    gap: 8px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 320px;
  }

  .field-label {
    font-size: 12px;
    opacity: 0.75;
  }

  .field input {
    padding: 8px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }
</style>
