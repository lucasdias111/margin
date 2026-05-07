<script lang="ts">
  import ManageHeader from '$src/components/content/manage/ManageHeader.svelte'
  import ManageSpaces from '$src/components/content/manage/spaces/ManageSpaces.svelte'
  import ManageMargin from '$src/components/content/manage/margin/ManageMargin.svelte'
  import ManageSubscription from '$src/components/content/manage/subscription/ManageSubscription.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
</script>

<div class="manage-window">
  <ManageHeader
    activeTab={navigationState.manageTab}
    onTabChange={(tab) => (navigationState.manageTab = tab)}
  />

  {#if navigationState.manageTab === 'Spaces'}
    <ManageSpaces />
  {:else if navigationState.manageTab === 'Margin'}
    <ManageMargin />
  {:else if navigationState.manageTab === 'Subscription'}
    <ManageSubscription />
  {/if}
</div>

<style>
  .manage-window {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    background-color: #ffffff;
    border-radius: 20px;
    overflow: hidden;
    font-family: 'Segoe UI', sans-serif;
  }
</style>
