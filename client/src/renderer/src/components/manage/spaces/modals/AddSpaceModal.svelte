<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import type { CreateSpace } from '$src/interfaces/Space'
  import { Visibility } from '$src/interfaces/Visibility'

  interface Props {
    marginId: number
    open: boolean
    onClose: () => void
    onAddSpace: (newSpace: CreateSpace) => void
  }

  let { marginId, open, onClose, onAddSpace }: Props = $props()

  let spaceName = $state('')
  let description = $state('')
  let visibility = $state<Visibility>(Visibility.PUBLIC)

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
    visibility = Visibility.PUBLIC
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
  <select bind:value={visibility}>
    <option value={Visibility.PUBLIC}>Public</option>
    <option value={Visibility.PRIVATE}>Private</option>
  </select>
  <div class="actions">
    <button class="cancel" onclick={onClose}>Cancel</button>
    <button class="confirm" onclick={handleSubmit}>Create</button>
  </div>
</AppModal>

<style>
  input,
  textarea,
  select {
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

  select {
    appearance: auto;
    background: #fff;
    cursor: pointer;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    color: #2d2d2d;
  }

  .confirm {
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
  }
</style>
