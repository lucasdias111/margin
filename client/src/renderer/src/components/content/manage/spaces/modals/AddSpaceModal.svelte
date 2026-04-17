<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import type { CreateSpace, SpaceVisibility } from '$src/interfaces/Space'
  import Button from '$src/components/common/buttons/Button.svelte'
  import VisibilityToggle from '$src/components/common/visibility/VisibilityToggle.svelte'

  interface Props {
    marginId: number
    open: boolean
    onClose: () => void
    onAddSpace: (newSpace: CreateSpace) => void
  }

  let { marginId, open, onClose, onAddSpace }: Props = $props()

  let spaceName = $state('')
  let description = $state('')
  let visibility = $state<SpaceVisibility>('PUBLIC')

  function handleSubmit(): void {
    const newSpace: CreateSpace = {
      name: spaceName,
      description: description,
      visibility: visibility,
      marginId: marginId
    }
    onAddSpace(newSpace)
    spaceName = ''
    description = ''
    visibility = 'PUBLIC'
    onClose()
  }
</script>

<AppModal {open} title="Add Space" {onClose}>
  <input
    type="text"
    placeholder="Space name"
    bind:value={spaceName}
    onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
  />
  <textarea placeholder="Description" bind:value={description} rows="3"></textarea>
  <VisibilityToggle bind:value={visibility} />
  <div class="actions">
    <Button buttonType="secondary" size="small" onClick={onClose} text="Cancel" />
    <Button buttonType="primary" size="small" onClick={handleSubmit} text="Create" />
  </div>
</AppModal>

<style>
  input,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
    margin-bottom: 16px;
  }

  textarea {
    resize: vertical;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
</style>
