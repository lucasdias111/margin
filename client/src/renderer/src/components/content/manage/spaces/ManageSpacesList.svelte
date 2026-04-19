<script lang="ts">
  import type { CreateSpace, Space } from '$src/interfaces/Space'
  import AddSpaceModal from '$src/components/content/manage/spaces/modals/AddSpaceModal.svelte'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import Button from '$src/components/common/buttons/Button.svelte'

  interface Props {
    spaces: Space[]
    selectedSpace: Space | null
    onSelectSpace: (space: Space) => void
    onAddSpace: (name: CreateSpace) => void
  }

  let { spaces, selectedSpace, onSelectSpace, onAddSpace }: Props = $props()

  let addSpaceOpen = $state(false)

  const SPACE_COLORS = [
    { bg: '#FFF0E6', dot: '#E8712A', text: '#C45A18' },
    { bg: '#E8F4F8', dot: '#4A9EBF', text: '#2E7A96' },
    { bg: '#EEF6EE', dot: '#5BAD6F', text: '#3D8A52' },
    { bg: '#F3EEF8', dot: '#9B72CF', text: '#7850AD' },
    { bg: '#FDF5E6', dot: '#C9A227', text: '#9E7D10' }
  ]

  function spaceColor(spaceId: number) {
    return SPACE_COLORS[spaceId % SPACE_COLORS.length]
  }

  function spaceInitials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
</script>

<div class="spaces-list">
  {#each spaces as space (space.spaceId)}
    {@const color = spaceColor(space.spaceId)}
    <Button buttonType="list" size="small" onClick={() => onSelectSpace(space)} fullWidth>
      <span class="space-avatar" style="background: {color.bg}; color: {color.text};">
        {spaceInitials(space.spaceName)}
      </span>
      <span class="space-name">{space.spaceName}</span>
    </Button>
  {/each}

  <Button
    buttonType="secondary"
    size="small"
    onClick={() => (addSpaceOpen = true)}
    text="Add space"
  />
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
    border-right: 1px solid #ebebeb;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }

  :global(.space-avatar) {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  :global(.space-name) {
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .space-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .space-name {
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
