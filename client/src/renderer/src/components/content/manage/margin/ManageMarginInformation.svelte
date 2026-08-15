<script lang="ts">
  import type { Margin, UpdateMargin } from '$src/interfaces/Margin'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import MarginIcon from '$src/components/content/margin/MarginIcon.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'

  interface Props {
    margin: Margin
    onSaveInfo: (margin: UpdateMargin) => Promise<void>
    onDeleteMargin: () => Promise<void>
  }

  let { margin, onSaveInfo, onDeleteMargin }: Props = $props()
  let showDeleteConfirm = $state(false)
  let icon = $state<File | null>(null)
  let previewUrl = $state<string | null>()
  let marginIcon = $state<string | null>(null)
  let editedName = $derived(margin.marginName ?? '')
  let editedDescription = $derived(margin.marginDescription ?? '')

  $effect(() => {
    editedName = margin.marginName ?? ''
    editedDescription = margin.marginDescription ?? ''
  })

  let isDirty = $derived(
    editedName !== (margin.marginName ?? '') ||
      editedDescription !== (margin.marginDescription ?? '') ||
      icon !== null
  )

  async function handleSave(): Promise<void> {
    await onSaveInfo({
      marginId: margin.marginId,
      marginName: editedName,
      description: editedDescription,
      marginIcon: icon
    })
    icon = null
    previewUrl = null
  }

  async function handleDelete(): Promise<void> {
    await onDeleteMargin()
  }

  async function onFileChange(file: File): Promise<void> {
    icon = file
  }

  async function onPreviewUrlChange(url: string): Promise<void> {
    previewUrl = url
  }

  $effect(() => {
    if (previewUrl) {
      marginIcon = previewUrl
    } else {
      marginIcon = margin.marginIconUrl
    }
  })
</script>

<div class="margin-information">
  <div class="section-header">
    <h2>Information</h2>
    <Button
      buttonType="primary"
      size="small"
      text="Save changes"
      onClick={handleSave}
      disabled={!isDirty}
    />
  </div>

  <div class="info-row">
    <div class="info-fields">
      <label for="margin-name-input">Name</label>
      <input
        id="margin-name-input"
        type="text"
        bind:value={editedName}
        placeholder={margin.marginName}
      />

      <label for="margin-description">Description</label>
      <textarea
        id="margin-description"
        rows="4"
        bind:value={editedDescription}
        placeholder={margin.marginDescription ?? 'No description'}
      ></textarea>
    </div>

    <div class="info-picture">
      <span class="picture-label"></span>
      <MarginIcon {marginIcon} width={100} height={100} />
      <UploadImageButton {onFileChange} {onPreviewUrlChange} />
    </div>
  </div>

  <div class="danger-zone">
    <div class="danger-zone-text">
      <span>Delete margin</span>
      <p>Permanently delete this margin, all its spaces, channels, and members.</p>
    </div>
    <Button buttonType="delete" size="small" text="Delete margin" onClick={() => (showDeleteConfirm = true)} />
  </div>
</div>

<ConfirmationModal
  open={showDeleteConfirm}
  title="Delete margin"
  message={`Permanently delete "${margin.marginName}", including all its spaces, channels, and members. This cannot be undone.`}
  confirmLabel="Delete margin"
  variant="delete"
  onConfirm={handleDelete}
  onClose={() => (showDeleteConfirm = false)}
/>

<style>
  .margin-information {
    flex: 1;
    border-right: 1px solid #d9d9d9;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  h2 {
    font-size: 1.1rem;
    color: #2d2d2d;
    font-weight: 600;
    margin: 0;
  }

  .info-row {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .info-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  label {
    font-size: 0.8rem;
    color: #888;
  }

  input[type='text'],
  textarea {
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.9rem;
    color: #2d2d2d;
    outline: none;
    resize: none;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input[type='text']:focus,
  textarea:focus {
    border-color: #f5a623;
  }

  .info-picture {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .picture-label {
    font-size: 0.78rem;
    color: #888;
  }

  .danger-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    padding: 14px 16px;
    border: 1px solid #f5c6c5;
    border-radius: 8px;
    background: #fff8f8;
  }

  .danger-zone-text span {
    font-size: 0.88rem;
    font-weight: 600;
    color: #2d2d2d;
  }

  .danger-zone-text p {
    font-size: 0.78rem;
    color: #888;
    margin: 2px 0 0 0;
  }
</style>
