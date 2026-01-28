<script lang="ts">
  import type { DirectMessage } from '$src/interfaces/Messages'
  import MessageBubble from './MessageBubble.svelte'

  interface Props {
    message: DirectMessage
  }

  let { message }: Props = $props()
</script>

<MessageBubble
  fromUserId={message.fromUserId}
  createdAt={message.createdAt}
  message={message.message}
  isEdited={message.isEdited}
  showReadStatus={true}
/>
