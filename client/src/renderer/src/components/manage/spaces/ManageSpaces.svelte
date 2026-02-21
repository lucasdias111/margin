<script lang="ts">
  import ManageSpaceInformation from '$src/components/manage/spaces/ManageSpaceInformation.svelte'
  import ManageSpaceMembers from '$src/components/manage/spaces/ManageSpaceMembers.svelte'
  import ManageSpacesList from '$src/components/manage/spaces/ManageSpacesList.svelte'
  import type { Space } from '$src/interfaces/Space'
  import { onMount } from 'svelte'
  import { spacesService } from '$src/services/SpacesService'

  let spaces = $state<Space[]>([])
  let selectedSpace = $state<Space | null>(null)


  onMount(async () => {
    spaces = await spacesService.getAllSpacesForServer()
  })

  function onSelectSpace(space: Space): void {
    selectedSpace = space
  }
</script>

<div class="manage-spaces-window">
  <ManageSpacesList {spaces} {selectedSpace} {onSelectSpace} />
  <ManageSpaceInformation {selectedSpace} />
  <ManageSpaceMembers {selectedSpace} />
</div>

<style>
  .manage-spaces-window {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
</style>
