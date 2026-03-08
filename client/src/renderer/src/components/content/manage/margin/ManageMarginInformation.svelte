<script lang="ts">
  import type { Margin, UpdateMargin } from '$src/interfaces/Margin'
  import SaveButton from '$src/components/common/buttons/SaveButton.svelte'
  import DangerButton from '$src/components/common/buttons/DangerButton.svelte'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'

  interface Props {
    margin: Margin
    onSaveInfo: (margin: UpdateMargin) => Promise<void>
    onDeleteMargin: () => Promise<void>
  }

  let { margin, onSaveInfo, onDeleteMargin }: Props = $props()
  let icon = $state<File | null>(null)
  let previewUrl = $state<string | null>(avatar)
  let editedName = $state(margin.marginName ?? '')
  let editedDescription = $state(margin.marginDescription ?? '')

  // Reset fields when margin changes (e.g. external update)
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
</script>

<div class="margin-information">
  <div class="section-header">
    <h2>Information</h2>
    <SaveButton {isDirty} onSave={handleSave} />
  </div>

  <div class="info-row">
    <div class="info-fields">
      <label for="margin-name-input">Margin name</label>
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
      <span class="picture-label">Margin picture</span>
      <UserAvatar profilePictureUrl={previewUrl} width={100} height={100} />
      <UploadImageButton {onFileChange} {onPreviewUrlChange} />
    </div>
  </div>

  <div class="danger-zone">
    <div class="danger-zone-text">
      <span>Delete margin</span>
      <p>Permanently delete this margin, all its spaces, channels, and members.</p>
    </div>
    <DangerButton label="Delete margin" onAction={handleDelete} />
  </div>
</div>

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

  .picture-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #d9d9d9;
  }

  .upload-btn {
    background: #2d2d2d;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 7px 16px;
    font-size: 0.85rem;
    cursor: pointer;
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
