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
    if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
      phase = 'unavailable'
      message = 'This meeting has ended.'
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
  {#if phase === 'loading'}
    <p class="meet-status">Loading meeting…</p>
  {:else if phase === 'unavailable'}
    <div class="meet-card">
      <h1 class="meet-title">Meeting unavailable</h1>
      <p class="meet-status">{message}</p>
      {#if !isGuest}
        <button class="meet-btn" onclick={() => push('/home')}>Back to Margin</button>
      {/if}
    </div>
  {:else if phase === 'lobby'}
    <MeetingLobby {code} onAdmitted={join} {onKnocked} />
  {:else if phase === 'knocking'}
    <div class="meet-card">
      <h1 class="meet-title">Waiting to be let in</h1>
      <p class="meet-status">The host has been notified. Keep this page open.</p>
    </div>
  {:else if phase === 'ready'}
    <div class="meet-card">
      <h1 class="meet-title">{meeting?.title ?? 'Meeting'}</h1>
      <p class="meet-status">Hosted in {meeting?.marginName}</p>
      <button class="meet-btn" onclick={join}>Join meeting</button>
    </div>
  {:else}
    <MeetingCallWindow onLeave={leave} />
  {/if}
</div>

<style>
  .meet-page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f2eee8;
  }

  .meet-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
  }

  .meet-title {
    margin: 0;
    font-size: 22px;
  }

  .meet-status {
    margin: 0;
    opacity: 0.75;
  }

  .meet-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    font-size: 15px;
    cursor: pointer;
  }
</style>
