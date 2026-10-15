<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { meetingAdmissionService } from '$src/services/MeetingAdmissionService'
  import type { MeetingParticipantInfo } from '$src/interfaces/Meetings'

  const { code }: { code: string } = $props()

  let waiting = $state<MeetingParticipantInfo[]>([])
  let poll: ReturnType<typeof setInterval> | null = null

  async function refresh(): Promise<void> {
    waiting = await meetingAdmissionService.waiting(code)
  }

  onMount(async () => {
    await refresh()
    poll = setInterval(refresh, 5000)
  })

  onDestroy(() => {
    if (poll) clearInterval(poll)
  })

  async function admit(participantId: number): Promise<void> {
    if (await meetingAdmissionService.admit(code, participantId)) await refresh()
  }

  async function deny(participantId: number): Promise<void> {
    if (await meetingAdmissionService.deny(code, participantId)) await refresh()
  }
</script>

{#if waiting.length > 0}
  <div class="admit-panel">
    <p class="admit-title">Waiting to join</p>
    {#each waiting as person (person.participantId)}
      <div class="admit-row">
        <span class="admit-name">{person.displayName}</span>
        <button class="admit-btn" onclick={() => admit(person.participantId)}>Admit</button>
        <button class="deny-btn" onclick={() => deny(person.participantId)}>Deny</button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .admit-panel {
    position: absolute;
    top: 16px;
    right: 16px;
    background: #f2eee8;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 240px;
    z-index: 20;
  }

  .admit-title {
    margin: 0;
    font-size: 12px;
    opacity: 0.75;
  }

  .admit-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .admit-name {
    flex: 1;
    font-size: 14px;
  }

  .admit-btn,
  .deny-btn {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    border: none;
  }

  .admit-btn {
    background-color: #f47e3a;
    color: white;
  }

  .deny-btn {
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.15);
  }
</style>
