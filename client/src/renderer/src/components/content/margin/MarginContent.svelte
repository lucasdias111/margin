<script lang="ts">
  import SpaceChatContent from '$src/components/content/SpaceChatContent.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import MarginHome from '$src/components/content/margin/MarginHome.svelte'

  let hasSelectedChannel = $derived(!!chatState.selectedChannel)
</script>

<div class="margin-main">
  {#if hasSelectedChannel}
    <SpaceChatContent />
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
