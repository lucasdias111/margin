<script lang="ts">
  import IncomingCallModal from '$src/components/content/call/modal/IncomingCallModal.svelte'
  import { incomingCallService } from '$src/services/call/IncomingCallService'
  import { incomingCallState } from '$src/states/IncomingCallState.svelte'
  import { NotificationSounds } from '$src/utils/NotificationSounds'

  const ringtone = new Audio(NotificationSounds.INCOMING_CALL)
  ringtone.loop = true

  $effect(() => {
    if (incomingCallState.isRinging) {
      ringtone.currentTime = 0
      ringtone.play().catch(() => {})
    } else {
      ringtone.pause()
      ringtone.currentTime = 0
    }
  })
</script>

{#if incomingCallState.offer}
  <IncomingCallModal
    caller={incomingCallState.offer.caller}
    onAccept={() => incomingCallService.acceptCall()}
    onDecline={() => incomingCallService.declineCall()}
  />
{:else if incomingCallState.channelInvite}
  <IncomingCallModal
    caller={incomingCallState.channelInvite.fromUser}
    subtitle="Channel call invite"
    channelName={incomingCallState.channelInvite.channelName}
    acceptLabel="Join"
    onAccept={() => incomingCallService.acceptChannelInvite()}
    onDecline={() => incomingCallService.declineChannelInvite()}
  />
{/if}
