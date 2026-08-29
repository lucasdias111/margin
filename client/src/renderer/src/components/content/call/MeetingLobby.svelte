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
  let signingUp = $state(false)
  let email = $state('')
  let password = $state('')

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
    if (signingUp && (!email.trim() || !password)) {
      message = 'Enter an email and a password, or join as a guest instead.'
      return
    }

    phase = 'joining'
    message = ''

    const session = await meetingGuestService.startSession(code, displayName.trim())
    if (!session) {
      phase = 'lobby'
      message = 'We could not join you to this meeting. Try again in a moment.'
      return
    }

    if (signingUp) {
      const outcome = await meetingGuestService.claim(email.trim(), password)
      if (outcome === 'email-in-use') {
        phase = 'lobby'
        message = 'That email already has an account. Sign in instead, or join as a guest.'
        return
      }
      if (outcome === 'failed') {
        phase = 'lobby'
        message = 'We could not create your account. Try joining as a guest.'
        return
      }
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
      <Button buttonType="secondary" size="small" onClick={goBack}>
        <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
        Back
      </Button>
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

      {#if signingUp}
        <label class="field">
          <span class="field-label">Email</span>
          <input type="email" bind:value={email} placeholder="you@example.com" />
        </label>
        <label class="field">
          <span class="field-label">Password</span>
          <input type="password" bind:value={password} placeholder="••••••••" />
        </label>
      {/if}

      {#if message}
        <p class="note error">{message}</p>
      {/if}

      <Button
        buttonType="primary"
        size="large"
        fullWidth
        disabled={phase === 'joining'}
        text={phase === 'joining'
          ? 'Joining…'
          : signingUp
            ? 'Create account and join'
            : 'Join as guest'}
        onClick={joinAsGuest}
      />

      <Button
        buttonType="secondary"
        size="small"
        fullWidth
        disabled={phase === 'joining'}
        text={signingUp ? 'Just join as a guest' : 'Create a margin account'}
        onClick={() => {
          signingUp = !signingUp
          message = ''
        }}
      />

      <p class="note">
        {signingUp
          ? 'You keep your place in the meeting; confirm your email afterwards to sign in later.'
          : preview?.requireAdmission
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
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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
