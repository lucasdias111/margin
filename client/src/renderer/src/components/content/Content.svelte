<script lang="ts">
  import PrivateChatContent from '$src/components/content/PrivateChatContent.svelte'
  import MarginContent from '$src/components/content/margin/MarginContent.svelte'
  import { chatState } from '$src/states/ChatState.svelte'

  let selectedContent = $derived(chatState.currentlySelectedContent)
</script>

<div class="content">
  {#if selectedContent === 'private'}
    <PrivateChatContent />
  {:else if selectedContent === 'margin'}
    <MarginContent />
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
