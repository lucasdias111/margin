<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import type { ChatViewType } from '$src/interfaces/Content'
  import { notificationState } from '$src/states/NotificationState.svelte'
  import { userState } from '$src/states/UserState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'

  function onContentSelected(selectedContent: ChatViewType): void {
    chatState.selectContent(selectedContent)
  }
</script>

<div class="button-group">
  <button onclick={() => onContentSelected('private')}>Private conversations
    <UnreadNotificationBadge userId={null} />
  </button>
  <button onclick={() => onContentSelected('space')}>Spaces</button>
  <button onclick={() => onContentSelected('explore')}>Explore</button>
</div>
<hr />

<style>
  .button-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .button-group button {
    font-size: 1rem;
    width: 100%;
    background: #3a3737;
    cursor: pointer;
    transition: background 0.2s;
  }
</style>
