<script lang="ts">
  import ManageHeader from '$src/components/manage/ManageHeader.svelte'
  import ManageSpaces from '$src/components/manage/spaces/ManageSpaces.svelte'
</script>

<div class="manage-window">
  <ManageHeader />
  <ManageSpaces />
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
