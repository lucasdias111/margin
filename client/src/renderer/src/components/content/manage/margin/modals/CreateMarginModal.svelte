<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import { marginService } from '$src/services/MarginService'
  import { chatState } from '$src/states/ChatState.svelte.js'
  import { Visibility } from '$src/interfaces/Visibility'

  interface Props {
    open: boolean
    onClose: () => void
  }

  let { open, onClose }: Props = $props()

  let marginName = $state('')
  let marginDescription = $state('')
  let visibility = $state<Visibility>(Visibility.PUBLIC)

  async function handleSubmit(): Promise<void> {
    const newMargin = await marginService.createMargin({
      marginName,
      marginDescription,
      visibility
    })
    chatState.selectMargin(newMargin)
    marginName = ''
    marginDescription = ''
    onClose()
  }
</script>

<AppModal {open} title="Create Margin" {onClose}>
  <input
    type="text"
    placeholder="Margin name"
    bind:value={marginName}
    onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
  />
  <textarea placeholder="Description" bind:value={marginDescription} rows="3"></textarea>
  <div class="actions">
    <button class="cancel" onclick={onClose}>Cancel</button>
    <button class="confirm" onclick={handleSubmit} disabled={!marginName.trim()}>Create</button>
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
    font-family: inherit;
    box-sizing: border-box;
    margin-bottom: 16px;
    outline: none;
  }

  input:focus,
  textarea:focus {
    border-color: #f5a623;
  }

  textarea {
    resize: vertical;
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

  .confirm:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
