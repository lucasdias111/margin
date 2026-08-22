<script lang="ts">
  import PrivateChatContent from '$src/components/content/chat/private/PrivateChatContent.svelte'
  import GroupChatContent from '$src/components/content/chat/group/GroupChatContent.svelte'
  import MarginContent from '$src/components/content/margin/MarginContent.svelte'
  import SettingsContent from '$src/components/content/settings/SettingsContent.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { viewIn, viewOut } from '$src/animations'

  let selectedContent = $derived(navigationState.view)
  let showingGroup = $derived(
    selectedContent === 'private' && navigationState.selectedGroupConversation !== null
  )

  /**
   * One key per distinct pane, so switching sections cross-fades but staying
   * inside a section (e.g. picking another conversation) doesn't.
   */
  let paneKey = $derived(
    selectedContent === 'private' ? (showingGroup ? 'group' : 'private') : selectedContent
  )
</script>

<div class="content">
  {#key paneKey}
    <div class="pane-swap" in:viewIn out:viewOut>
      {#if selectedContent === 'private'}
        {#if showingGroup}
          <GroupChatContent />
        {:else}
          <PrivateChatContent />
        {/if}
      {:else if selectedContent === 'margin'}
        <MarginContent />
      {:else if selectedContent === 'settings'}
        <SettingsContent />
      {/if}
    </div>
  {/key}
</div>

<style>
  .content {
    position: relative;
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 0;
    height: 100%;
    box-sizing: border-box;
    gap: 10px;
  }

  /**
   * Both panes exist for the length of the cross-fade. The outgoing one is
   * pulled out of flow so it can't push the incoming one around.
   */
  .pane-swap {
    display: flex;
    flex: 1;
    min-width: 0;
    height: 100%;
    gap: 10px;
  }

  .pane-swap:not(:only-child) {
    position: absolute;
    inset: 0;
  }

  @media (max-width: 768px) {
    .content,
    .pane-swap {
      gap: 0;
    }
  }
</style>
