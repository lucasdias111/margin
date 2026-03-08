<script lang="ts">
  import ChannelChatContent from '$src/components/content/chat/channel/ChannelChatContent.svelte'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import MarginHome from '$src/components/content/margin/MarginHome.svelte'

  let hasSelectedChannel = $derived(!!chatState.selectedChannel)
</script>

<div class="margin-main">
  {#if hasSelectedChannel}
    <ChannelChatContent />
  {:else}
    <MarginHome />
  {/if}
</div>

<style>
  .margin-main {
    flex: 1;
    display: flex;
    min-height: 0;
    min-width: 0;
  }
</style>
