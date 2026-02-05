<script lang="ts">

  import { chatState } from '$src/states/ChatState.svelte'
  import UnreadNotificationBadge from '$src/components/chat/UnreadNotificationBadge.svelte'
  import type { User } from '$src/interfaces/User'

  interface Props {
    user: User
  }

  let { user }: Props = $props()
</script>

<div>
  <li>
    <button onclick={() => chatState.selectUser(user)}>
      {user.username}
      <UnreadNotificationBadge userId={user.id} />
    </button>
  </li>
</div>

<style>

</style>
