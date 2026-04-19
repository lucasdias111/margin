<script lang="ts">
  import type { Space, SpaceVisibility } from '$src/interfaces/Space'
  import Button from '$src/components/common/buttons/Button.svelte'
  import VisibilityToggle from '$src/components/common/visibility/VisibilityToggle.svelte'

  interface Props {
    selectedSpace: Space
    onSaveInfo?: (space: Space) => Promise<void>
    onDeleteSpace?: (space: Space) => Promise<void>
  }

  let { selectedSpace, onSaveInfo, onDeleteSpace }: Props = $props()

  let editedName = $derived(selectedSpace?.spaceName ?? '')
  let editedDescription = $derived(selectedSpace?.spaceDescription ?? '')
  let editedVisibility = $derived<SpaceVisibility>(selectedSpace?.visibility ?? 'PUBLIC')

  $effect(() => {
    editedName = selectedSpace?.spaceName ?? ''
    editedDescription = selectedSpace?.spaceDescription ?? ''
    editedVisibility = selectedSpace?.visibility ?? 'PUBLIC'
  })

  let isDirty = $derived(
    editedName !== (selectedSpace?.spaceName ?? '') ||
      editedDescription !== (selectedSpace?.spaceDescription ?? '') ||
    editedVisibility !== (selectedSpace?.visibility ?? 'PUBLIC')
  )

  async function handleSave(): Promise<void> {
    await onSaveInfo?.({
      ...selectedSpace,
      spaceName: editedName,
      spaceDescription: editedDescription,
      visibility: editedVisibility
    })
  }

  async function handleDelete(): Promise<void> {
    await onDeleteSpace?.(selectedSpace)
  }
</script>

<div class="spaces-details">
  <div class="section-header">
    <h2>Information</h2>
    <Button
      buttonType="primary"
      size="small"
      text="Save information"
      disabled={!isDirty}
      onClick={handleSave}
    />
  </div>
  <div class="info-row">
    <div class="info-fields">
      <label for="space-name-input">Space name</label>
      <input
        class="space-name-input"
        type="text"
        id="space-name-input"
        bind:value={editedName}
        placeholder={selectedSpace.spaceName}
      />
      <label for="space-description">Description</label>
      <textarea
        id="space-description"
        rows="4"
        bind:value={editedDescription}
        placeholder={selectedSpace.spaceDescription}
      ></textarea>
    </div>
    <div class="info-picture">
      <span class="picture-label">Margin picture</span>
      <div class="picture-circle"></div>
      <button class="upload-btn">Upload</button>
    </div>
  </div>

  <VisibilityToggle bind:value={editedVisibility} />

  <div class="danger-zone">
    <div class="danger-zone-text">
      <span>Delete space</span>
      <p>Permanently delete the space and all its channels.</p>
    </div>
    <Button
      buttonType="danger"
      size="small"
      text="Delete space"
      disabled={isDirty}
      onClick={handleDelete}
    />
  </div>
</div>

<style>
  .spaces-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
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
