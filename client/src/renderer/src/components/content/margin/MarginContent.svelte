<script lang="ts">
  import ChannelChatContent from '$src/components/content/chat/channel/ChannelChatContent.svelte'
  import MarginHome from '$src/components/content/margin/MarginHome.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'

  let hasSelectedChannel = $derived(!!navigationState.selectedChannel)
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
