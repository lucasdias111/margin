<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    onSubmit: (title: string, body: string) => void
  }

  let { open, onClose, onSubmit }: Props = $props()

  let title = $state('')
  let body = $state('')

  const canSubmit = $derived(title.trim().length > 0 && body.trim().length > 0)

  function handleSubmit(): void {
    if (!canSubmit) return
    onSubmit(title.trim(), body.trim())
    title = ''
    body = ''
  }
</script>

<AppModal {open} title="New post" {onClose}>
  <input
    type="text"
    class="post-title-input"
    placeholder="Title"
    maxlength="100"
    bind:value={title}
  />
  <textarea class="post-body-input" placeholder="Write your post…" rows="5" bind:value={body}
  ></textarea>
  <div class="actions">
    <button class="cancel" onclick={onClose}>Cancel</button>
    <button class="confirm" disabled={!canSubmit} onclick={handleSubmit}>Post</button>
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
    background: #f5c4a0;
    cursor: default;
  }
</style>
