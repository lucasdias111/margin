<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    onSubmit: (title: string, content: string) => Promise<void>
    initialTitle?: string
    initialContent?: string
  }

  let { open, onClose, onSubmit, initialTitle = '', initialContent = '' }: Props = $props()

  let title = $state('')
  let content = $state('')

  $effect(() => {
    if (open) {
      title = initialTitle
      content = initialContent
    }
  })

  async function handleSubmit(): Promise<void> {
    await onSubmit(title, content)
    onClose()
    clear()
  }

  function handleCancel(): void {
    onClose()
    clear()
  }

  function clear(): void {
    title = ''
    content = ''
  }
</script>

<AppModal
  {open}
  title={initialTitle ? 'Edit Announcement' : 'New Announcement'}
  onClose={handleCancel}
>
  <div class="broadcast-banner">
    <Icon name="notifications" size={13} strokeWidth={2.5} />
    This announcement will be sent to all members of the margin
  </div>

  <div class="field">
    <label for="announcement-title">Title</label>
    <input
      id="announcement-title"
      type="text"
      bind:value={title}
      placeholder="Announcement title"
    />
  </div>

  <div class="field">
    <label for="announcement-content">Content</label>
    <textarea
      id="announcement-content"
      bind:value={content}
      placeholder="Write your announcement..."
      rows={5}
    ></textarea>
  </div>

  <div class="actions">
    <button class="cancel" onclick={handleCancel}>Cancel</button>
    <button class="confirm" onclick={handleSubmit} disabled={!title.trim() || !content.trim()}
      >Post</button
    >
  </div>
</AppModal>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .field label {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field input,
  .field textarea {
    padding: 9px 14px;
    border-radius: 10px;
    border: 2px solid #e8e8e8;
    font-size: 14px;
    font-family: inherit;
    color: #2d2d2d;
    background: white;
    outline: none;
    resize: vertical;
  }

  .field input:focus,
  .field textarea:focus {
    border-color: #ff6203;
  }

  .broadcast-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff4ee;
    border: 1px solid #ffd4b8;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 500;
    color: #c75000;
    margin-bottom: 16px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 5% 0 1% 0;
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
