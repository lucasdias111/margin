<script lang="ts">
  import type { CreateSpace, Space } from '$src/interfaces/Space'
  import AddSpaceModal from '$src/components/manage/spaces/modals/AddSpaceModal.svelte'
  import { chatState } from '$src/states/ChatState.svelte'

  interface Props {
    spaces: Space[]
    selectedSpace: Space | null
    onSelectSpace: (space: Space) => void
    onAddSpace: (name: CreateSpace) => void
  }

  let { spaces, selectedSpace, onSelectSpace, onAddSpace }: Props = $props()

  let addSpaceOpen = $state(false)
</script>

<div class="spaces-list">
  {#each spaces as space (space.spaceId)}
    <button
      class="space-item"
      class:selected={selectedSpace?.spaceId === space.spaceId}
      onclick={() => onSelectSpace(space)}
    >
      {space.spaceName}
    </button>
  {/each}
  <button class="add-space-btn" onclick={() => (addSpaceOpen = true)}>Add space</button>
</div>

<AddSpaceModal
  marginId={chatState.selectedMargin.marginId}
  open={addSpaceOpen}
  onClose={() => (addSpaceOpen = false)}
  {onAddSpace}
/>

<style>
  .spaces-list {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid #d9d9d9;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  .space-item {
    background: none;
    border: none;
    text-align: left;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.95rem;
    color: #2d2d2d;
    cursor: pointer;
    font-weight: 500;
  }

  .space-item.selected {
    background: #ffebe5;
  }

  .space-item:hover:not(.selected) {
    background: #f6f2f2;
  }

  .add-space-btn {
    margin-top: 12px;
    background: #f47e3a;
    border: none;
    border-radius: 20px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 9px 16px;
    cursor: pointer;
    align-self: center;
  }
</style>
