<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { authenticationService } from '$src/services/AuthenticationService'
  import { sessionHandler } from '$src/handlers/SessionHandler'
  import { meetingCallService } from '$src/services/call/MeetingCallService'
  import { callState } from '$src/states/CallState.svelte'
  import { meetingService } from '$src/services/MeetingService'
  import { meetingGuestService } from '$src/services/MeetingGuestService'
  import { meetingLobbySocket } from '$src/services/MeetingLobbySocket'
  import MeetingCallWindow from '$src/components/content/call/MeetingCallWindow.svelte'
  import MeetingLobby from '$src/components/content/call/MeetingLobby.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { riseIn } from '$src/animations'
  import { isMeetingJoinable } from '$src/utils/MeetingUtils'
  import type { Meeting } from '$src/interfaces/Meetings'

  const { params }: { params?: { code?: string } } = $props()
  const code = $derived(params?.code ?? '')

  type Phase = 'loading' | 'ready' | 'lobby' | 'knocking' | 'in-call' | 'unavailable'

  let phase = $state<Phase>('loading')
  let meeting = $state<Meeting | null>(null)
  let message = $state('')
  let isGuest = $state(false)

  onMount(async () => {
    // A token already in this tab means we are signed in; tryRestoreSession only recovers a
    // saved session, so on its own it treats a signed-in creator as a guest.
    const signedIn =
      sessionStorage.getItem('authToken') !== null ||
      (await authenticationService.tryRestoreSession())

    if (!signedIn) {
      isGuest = true
      phase = 'lobby'
      return
    }

    await sessionHandler.getCurrentUser()

    meeting = await meetingService.getMeeting(code)
    if (!meeting) {
      phase = 'unavailable'
      message = 'This meeting link is not valid, or you do not have access to it.'
      return
    }
    if (!isMeetingJoinable(meeting)) {
      phase = 'unavailable'
      message =
        meeting.status === 'CANCELLED'
          ? 'This meeting was cancelled.'
          : 'This meeting is no longer available.'
      return
    }
    phase = 'ready'
  })

  async function join(): Promise<void> {
    phase = 'in-call'
    await meetingCallService.joinMeeting(code)

    // joinMeeting reports its own error; if no call came up, fall back to where the user was
    // rather than leaving them on an empty call window.
    if (!callState.isGroupCall) {
      phase = isGuest ? 'lobby' : 'ready'
    }
  }

  function onKnocked(): void {
    phase = 'knocking'
    meetingLobbySocket.connect((signal) => {
      if (signal === 'admitted') {
        meetingLobbySocket.disconnect()
        join()
        return
      }
      meetingLobbySocket.disconnect()
      phase = 'unavailable'
      message =
        signal === 'denied' ? 'The host did not let you in.' : 'You were removed from this meeting.'
    })
  }

  function goBack(): void {
    if (isGuest) {
      meetingLobbySocket.disconnect()
      meetingGuestService.endSession()
    }
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    push('/home')
  }

  function leave(): void {
    if (isGuest) {
      meetingLobbySocket.disconnect()
      meetingGuestService.endSession()
      phase = 'unavailable'
      message = 'You have left the meeting.'
      return
    }
    push('/home')
  }
</script>

<div class="meet-page">
  {#if phase === 'in-call'}
    <MeetingCallWindow onLeave={leave} />
  {:else if phase === 'lobby'}
    <MeetingLobby {code} onAdmitted={join} {onKnocked} />
  {:else}
    <div class="meet-card" in:riseIn>
      <div class="card-header">
        <Button buttonType="secondary" size="small" onClick={goBack}>
          <Icon name="chevronLeft" size={16} strokeWidth={2.2} />
          Back
        </Button>
        <div class="header-text">
          {#if phase === 'loading'}
            <h1 class="meet-title">Meeting</h1>
          {:else if phase === 'unavailable'}
            <h1 class="meet-title">Meeting unavailable</h1>
          {:else if phase === 'knocking'}
            <h1 class="meet-title">Waiting to be let in</h1>
          {:else}
            <h1 class="meet-title">{meeting?.title ?? 'Meeting'}</h1>
            {#if meeting}
              <p class="meet-subtitle">Hosted in {meeting.marginName}</p>
            {/if}
          {/if}
        </div>
      </div>

      {#if phase === 'loading'}
        <p class="meet-status">Loading meeting…</p>
      {:else if phase === 'unavailable'}
        <p class="meet-status">{message}</p>
      {:else if phase === 'knocking'}
        <p class="meet-status">The host has been notified. Keep this page open.</p>
      {:else}
        <Button buttonType="primary" size="large" fullWidth text="Join meeting" onClick={join} />
      {/if}
    </div>
  {/if}
</div>

<style>
  .meet-page {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background-color: #f2eee8;
    color: #2d2d2d;
  }

  .meet-card {
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

  .meet-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #2d2d2d;
    letter-spacing: -0.2px;
  }

  .meet-subtitle,
  .meet-status {
    margin: 0;
    font-size: 12px;
    color: #77776f;
  }
</style>
