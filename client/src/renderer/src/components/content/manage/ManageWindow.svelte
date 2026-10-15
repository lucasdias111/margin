<script lang="ts">
  import ManageHeader from '$src/components/content/manage/ManageHeader.svelte'
  import ManageSpaces from '$src/components/content/manage/spaces/ManageSpaces.svelte'
  import ManageMargin from '$src/components/content/manage/margin/ManageMargin.svelte'
  import ManageSubscription from '$src/components/content/manage/subscription/ManageSubscription.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'
  import { MarginRole } from '$src/interfaces/Margin'
  import { viewIn } from '$src/animations'

  const isOwner = $derived(
    navigationState.selectedMargin?.members.find((m) => m.user.id === sessionState.currentUser?.id)
      ?.role === MarginRole.OWNER
  )

  $effect(() => {
    if (!isOwner && navigationState.manageTab === 'Subscription') {
      navigationState.manageTab = 'Margin'
    }
  })
</script>

<div class="pane manage-window" in:viewIn>
  <ManageHeader
    activeTab={navigationState.manageTab}
    onTabChange={(tab) => (navigationState.manageTab = tab)}
    {isOwner}
  />

  {#if navigationState.manageTab === 'Spaces'}
    <ManageSpaces />
  {:else if navigationState.manageTab === 'Margin'}
    <ManageMargin />
  {:else if navigationState.manageTab === 'Subscription' && isOwner}
    <ManageSubscription />
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
