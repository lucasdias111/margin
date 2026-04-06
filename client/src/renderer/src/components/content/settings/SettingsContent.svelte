<script lang="ts">
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { userState } from '$src/states/UserState.svelte.js'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import { userService } from '$src/services/UserService'

  let newProfilePicture = $state<File | null>(null)
  let previewUrl = $state<string | null>(userState.currentUser.profilePictureUrl)
  let displayName = $state(userState.currentUser.displayName)
  let email = $state(userState.currentUser.email)
  let editingField = $state<'displayName' | 'email' | null>(null)

  const hasChanges = $derived(
    displayName !== userState.currentUser.displayName ||
      email !== userState.currentUser.email ||
      newProfilePicture !== null
  )

  function onFileChange(file: File): void {
    newProfilePicture = file
  }

  function onPreviewUrlChange(url: string): void {
    previewUrl = url
  }

  function startEditing(field: 'displayName' | 'email'): void {
    editingField = field
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') editingField = null
    if (e.key === 'Escape') {
      displayName = userState.currentUser.displayName
      email = userState.currentUser.email
      editingField = null
    }
  }

  function discardChanges(): void {
    displayName = userState.currentUser.displayName
    email = userState.currentUser.email
    previewUrl = userState.currentUser.profilePictureUrl
    newProfilePicture = null
    editingField = null
  }

  async function onSave(): Promise<void> {
    try {
      const formData = new FormData()
      if (displayName !== userState.currentUser.displayName)
        formData.append('displayName', displayName)
      if (email !== userState.currentUser.email) formData.append('email', email)
      if (newProfilePicture) formData.append('file', newProfilePicture)
      await userService.updateUserInfo(formData)

      displayName = userState.currentUser.displayName
      email = userState.currentUser.email
      previewUrl = userState.currentUser.profilePictureUrl
      newProfilePicture = null
      editingField = null
    } catch {
      // do nothing
    }
  }
</script>

<div class="content">
  <div class="content-inner">
    <h2 class="page-title">Profile</h2>

    <div class="avatar-section">
      <UserAvatar profilePictureUrl={previewUrl} height={80} width={80} />
      <div class="avatar-info">
        <span class="avatar-name">{displayName}</span>
        <UploadImageButton {onFileChange} {onPreviewUrlChange} label="Change photo" />
      </div>
    </div>

    <div class="divider"></div>

    <div class="fields">
      <div
        class="field"
        class:editing={editingField === 'displayName'}
        role="button"
        tabindex="0"
        onclick={() => startEditing('displayName')}
      >
        <span class="field-label">Display name</span>
        {#if editingField === 'displayName'}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="field-input"
            bind:value={displayName}
            onblur={() => (editingField = null)}
            onkeydown={handleKeydown}
            autofocus
          />
        {:else}
          <span class="field-value">{displayName}</span>
        {/if}
      </div>

      <div
        class="field"
        class:editing={editingField === 'email'}
        role="button"
        tabindex="0"
        onclick={() => startEditing('email')}
      >
        <span class="field-label">Email</span>
        {#if editingField === 'email'}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="field-input"
            bind:value={email}
            onblur={() => (editingField = null)}
            onkeydown={handleKeydown}
            autofocus
          />
        {:else}
          <span class="field-value">{email}</span>
        {/if}
      </div>
    </div>

    <div class="actions">
      <button class="discard-btn" disabled={!hasChanges} onclick={discardChanges}>Discard</button>
      <button class="save-btn" disabled={!hasChanges} onclick={onSave}>Save changes</button>
    </div>
  </div>
</div>

<style>
  .content {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    padding: 40px;
    box-sizing: border-box;
    overflow-y: auto;
    background: white;
    border-radius: 20px;
  }

  .content-inner {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .page-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .avatar-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .avatar-name {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .divider {
    height: 1px;
    background: #f0f0f0;
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .field:hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .field.editing {
    background: rgba(244, 126, 58, 0.04);
  }

  .field-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
  }

  .field-value {
    font-size: 0.9rem;
    color: #333;
  }

  .field-input {
    font-size: 0.9rem;
    color: #333;
    border: none;
    outline: none;
    background: transparent;
    padding: 0;
    border-bottom: 1.5px solid #f47e3a;
    font-family: inherit;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .discard-btn {
    padding: 8px 20px;
    background: none;
    color: #888;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .discard-btn:hover:not(:disabled) {
    background: #f5f5f5;
    color: #555;
  }

  .discard-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .save-btn {
    padding: 8px 20px;
    background: #f47e3a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.12s ease;
  }

  .save-btn:hover:not(:disabled) {
    background: #e06d2e;
  }

  .save-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
