<script lang="ts">
  import { notificationState } from '$src/states/NotificationState.svelte'

  let {
    userId = null
  }: {
    userId?: number | null
  } = $props()
</script>

<div>
  {#if userId === null && notificationState.getTotalUnreadDirectMessages() > 0}
    <span class="badge">■</span>
  {/if}
  {#if notificationState.getTotalUnreadDirectMessagesForUser(userId) > 0}
    <span class="badge">■</span>
  {/if}
</div>

<style>
  .badge {
    background-color: #b47024;
    color: white;
    border-radius: 10px;
    padding: 2px 5px;
    font-size: 12px;
    margin-left: 4px;
  }
</style>
