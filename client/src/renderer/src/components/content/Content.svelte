<script lang="ts">
  import PrivateChatContent from '$src/components/content/PrivateChatContent.svelte'
  import { chatState } from '$src/states/ChatState.svelte'
  import SpaceChatContent from '$src/components/content/SpaceChatContent.svelte'

  let selectedContent = $derived(chatState.currentlySelectedContent)
</script>

<div class="content">
  {#if selectedContent === 'private'}
    <PrivateChatContent />
  {:else if selectedContent === 'space'}
    <SpaceChatContent />
  {/if}
</div>

<style>
  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 0;
    height: 100%;
    box-sizing: border-box;
    gap: 10px;
  }
</style>
