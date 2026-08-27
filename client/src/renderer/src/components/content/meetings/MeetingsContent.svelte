<script lang="ts">
  import { push } from 'svelte-spa-router'
  import StartMeetingModal from '$src/components/content/call/StartMeetingModal.svelte'

  let showStartModal = $state(false)

  function onStarted(code: string): void {
    showStartModal = false
    push(`/meet/${code}`)
  }
</script>

<div class="meetings">
  <div class="meetings-header">
    <h1 class="meetings-title">Meetings</h1>
    <button class="plan-btn" onclick={() => (showStartModal = true)}>Plan meeting</button>
  </div>

  <p class="meetings-empty">
    Start a meeting and share the link. People outside Margin can join from a browser.
  </p>
</div>

{#if showStartModal}
  <StartMeetingModal onClose={() => (showStartModal = false)} {onStarted} />
{/if}

<style>
  .meetings {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 16px;
  }

  .meetings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .meetings-title {
    margin: 0;
    font-size: 20px;
  }

  .plan-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    background-color: #f47e3a;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }

  .meetings-empty {
    margin: 0;
    font-size: 13px;
    opacity: 0.75;
  }
</style>
