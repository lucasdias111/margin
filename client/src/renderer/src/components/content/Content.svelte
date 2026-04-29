<script lang="ts">
  import PrivateChatContent from '$src/components/content/chat/private/PrivateChatContent.svelte'
  import MarginContent from '$src/components/content/margin/MarginContent.svelte'
  import SettingsContent from '$src/components/content/settings/SettingsContent.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'

  let selectedContent = $derived(navigationState.view)
</script>

<div class="content">
  {#if selectedContent === 'private'}
    <PrivateChatContent />
  {:else if selectedContent === 'margin'}
    <MarginContent />
  {:else if selectedContent === 'settings'}
    <SettingsContent />
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
