<script lang="ts">
  import type { Message } from '$src/interfaces/Messages'
  import MessageBubble from './MessageBubble.svelte'

  interface Props {
    message: Message
  }

  let { message }: Props = $props()
</script>

<MessageBubble {message} showReadStatus={true} />
