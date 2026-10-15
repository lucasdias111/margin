<script lang="ts">
  import ManageHeader from '$src/components/content/manage/ManageHeader.svelte'
  import ManageSpaces from '$src/components/content/manage/spaces/ManageSpaces.svelte'
  import ManageMargin from '$src/components/content/manage/margin/ManageMargin.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { viewIn } from '$src/animations'
</script>

<div class="pane manage-window" in:viewIn>
  <ManageHeader
    activeTab={navigationState.manageTab}
    onTabChange={(tab) => (navigationState.manageTab = tab)}
  />

  {#if navigationState.manageTab === 'Spaces'}
    <ManageSpaces />
  {:else if navigationState.manageTab === 'Margin'}
    <ManageMargin />
  {/if}
</div>

<style>
  .manage-window {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    font-family: 'Segoe UI', sans-serif;
  }
</style>
