<script lang="ts">
  import ManageHeader from '$src/components/manage/ManageHeader.svelte'
  import ManageSpaces from '$src/components/manage/spaces/ManageSpaces.svelte'
  import ManageMargin from '$src/components/manage/margin/ManageMargin.svelte'

  let activeTab = $state('Margin')

</script>

<div class="manage-window">
  <ManageHeader {activeTab} onTabChange={(tab) => (activeTab = tab)} />

  {#if activeTab === 'Spaces'}
    <ManageSpaces />
  {:else if activeTab === 'Margin'}
    <ManageMargin />
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
