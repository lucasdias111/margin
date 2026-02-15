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

<div>
  <li>
    <button onclick={() => chatState.selectUser(user)}>
      {user.username}
      <UnreadNotificationBadge
        shouldShow={notificationState.getTotalUnreadDirectMessagesForUser(user.id) > 0}
      />
    </button>
  </li>
</div>

<style>

</style>
