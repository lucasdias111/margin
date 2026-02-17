<script lang="ts">
  import { chatState } from '$src/states/ChatState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'
  import type { User } from '$src/interfaces/User'
  import { notificationState } from '$src/states/NotificationState.svelte'

  interface Props {
    user: User
  }

  let { user }: Props = $props()
</script>

<button class="user-button" onclick={() => chatState.selectUser(user)}>
  {user.username}
  <UnreadNotificationBadge
    shouldShow={notificationState.getTotalUnreadDirectMessagesForUser(user.id) > 0}
  />
</button>

<style>
  .user-button {
    width: 100%;
    background: none;
    border: none;
    padding: 12px 16px;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
</style>
