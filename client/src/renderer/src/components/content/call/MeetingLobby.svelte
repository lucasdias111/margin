<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { srcObject } from '$src/actions/srcObject'
  import { meetingGuestService, type MeetingPreview } from '$src/services/MeetingGuestService'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { riseIn } from '$src/animations'

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
    message = ''

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
  <div class="card" in:riseIn>
    <div class="card-header">
      <button class="back-btn" onclick={goBack} aria-label="Back" title="Back">
        <Icon name="chevronLeft" size={20} color="#77776f" strokeWidth={2.2} />
      </button>
      <div class="header-text">
        {#if phase === 'unavailable'}
          <h1 class="title">Meeting unavailable</h1>
        {:else}
          <h1 class="title">{preview?.title || 'Meeting'}</h1>
          {#if preview}
            <p class="subtitle">
              {preview.hostDisplayName} invited you · {preview.marginName}
            </p>
          {/if}
        {/if}
      </div>
    </div>

    {#if phase === 'loading'}
      <p class="note">Loading…</p>
    {:else if phase === 'unavailable'}
      <p class="note">{message}</p>
    {:else}
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
        <p class="note error">{message}</p>
      {/if}

      <Button
        buttonType="primary"
        size="large"
        fullWidth
        disabled={phase === 'joining'}
        text={phase === 'joining' ? 'Joining…' : 'Join as guest'}
        onClick={joinAsGuest}
      />

      <p class="note">
        {preview?.requireAdmission
          ? 'The host will let you in.'
          : 'You will join the meeting straight away.'}
      </p>
    {/if}
  </div>
</div>

<style>
  .lobby {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #2d2d2d;
  }

  .card {
    width: 380px;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px;
    background: #ffffff;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: #fafafa;
    color: #77776f;
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-standard);
  }

  .back-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #2d2d2d;
    letter-spacing: -0.2px;
  }

  .subtitle {
    margin: 0;
    font-size: 12px;
    color: #77776f;
  }

  .note {
    margin: 0;
    font-size: 12px;
    color: #77776f;
    text-align: center;
  }

  .note.error {
    color: #c0392b;
  }

  .stage {
    width: 100%;
    height: 180px;
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
    color: #ffffff;
    font-size: 40px;
    font-weight: 600;
  }

  .device-row {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-label {
    font-size: 12px;
    color: #77776f;
  }

  .field input {
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    color: #2d2d2d;
    background: white;
  }

  .field input:focus {
    outline: 2px solid #ff843c;
    outline-offset: 1px;
  }
</style>
