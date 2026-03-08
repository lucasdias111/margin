<script lang="ts">
  import MessageBubble from '../../../common/chat/MessageBubble.svelte'
  import type { Message } from '$src/interfaces/Messages'

  interface Props {
    message: Message
  }

  let { message }: Props = $props()
</script>

<MessageBubble
  message={message}
/>
