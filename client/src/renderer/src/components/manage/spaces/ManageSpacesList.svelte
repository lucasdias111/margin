<script lang="ts">
  import type { Space } from '$src/interfaces/Space'

  interface Props {
    spaces: Space[]
    selectedSpace: Space | null
    onSelectSpace: (space: Space) => void
  }

  let { spaces, selectedSpace, onSelectSpace }: Props = $props()</script>

<div class="spaces-list">
  {#each spaces as space (space.spaceId)}
    <button
      class="space-item"
      class:selected={selectedSpace === space}
      onclick={() => onSelectSpace(space)}
    >
      {space.spaceName}
    </button>
  {/each}
  <button class="add-space-btn">Add space</button>
</div>

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

  .add-space-btn {
    margin-top: 12px;
    background: #ff6203;
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
