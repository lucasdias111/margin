<script lang="ts">
  import ChannelChatContent from '$src/components/content/chat/channel/ChannelChatContent.svelte'
  import ThreadChannelContent from '$src/components/content/chat/thread/ThreadChannelContent.svelte'
  import MarginHome from '$src/components/content/margin/MarginHome.svelte'
  import { isThreadChannel } from '$src/interfaces/Channel'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { viewIn, viewOut } from '$src/animations'

  let hasSelectedChannel = $derived(!!navigationState.selectedChannel)
  let showThreadChannel = $derived(isThreadChannel(navigationState.selectedChannel))

  /**
   * Keyed on the kind of pane, not the channel id — moving between channels is
   * handled inside the chat itself, so only a genuine change of pane crossfades.
   */
  let paneKey = $derived(hasSelectedChannel ? (showThreadChannel ? 'thread' : 'channel') : 'home')
</script>

<div class="margin-main">
  {#key paneKey}
    <div class="pane-swap" in:viewIn out:viewOut>
      {#if hasSelectedChannel && showThreadChannel}
        <ThreadChannelContent />
      {:else if hasSelectedChannel}
        <ChannelChatContent />
      {:else}
        <MarginHome />
      {/if}
    </div>
  {/key}
</div>

<style>
  .margin-main {
    position: relative;
    flex: 1;
    display: flex;
    min-height: 0;
    min-width: 0;
  }

  .pane-swap {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    gap: 10px;
  }

  .pane-swap:not(:only-child) {
    position: absolute;
    inset: 0;
  }
</style>
