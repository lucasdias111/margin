<script lang="ts">
  import type { ChannelMessage } from '$src/interfaces/Messages'
  import { userState } from '$src/states/UserState.svelte'
  import MessageBubble from './MessageBubble.svelte'

  interface Props {
    message: ChannelMessage
  }

  let { message }: Props = $props()
</script>

<MessageBubble
  fromUserId={message.fromUserId}
  createdAt={message.createdAt}
  message={message.message}
  isEdited={message.isEdited}
  username={message.fromUserId !== userState.currentUser?.id ? message.fromUsername : undefined}
/>
