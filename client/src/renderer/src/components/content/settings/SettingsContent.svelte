<script lang="ts">
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { userState } from '$src/states/UserState.svelte.js'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import { userService } from '$src/services/UserService'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'

  let newProfilePicture = $state<File | null>(null)
  let previewUrl = $state<string | null>(userState.currentUser.profilePictureUrl)
  let displayName = $state(userState.currentUser.displayName)
  let email = $state(userState.currentUser.email)
  let editingField = $state<'displayName' | 'email' | null>(null)
  let showDeleteConfirm = $state(false)

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

  async function onDeleteAccount(): Promise<void> {
    try {
      await userService.deleteAccount()
    } catch (e) {
      console.error('Failed to delete account:', e)
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
        onkeydown={handleKeydown}
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
        onkeydown={handleKeydown}
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
      <Button
        buttonType="danger"
        size="small"
        text="Discard"
        disabled={!hasChanges}
        onClick={discardChanges}
      />
      <Button buttonType="primary" size="small" text="Save changes" onClick={onSave} />
    </div>

    <div class="divider"></div>

    <div class="danger-zone">
      <div class="danger-info">
        <span class="danger-title">Delete account</span>
        <span class="danger-description">
          Permanently delete your account and all associated data. This action cannot be undone.
        </span>
      </div>
      <Button buttonType="delete" size="small" text="Delete account" onClick={onDeleteAccount} />
    </div>
  </div>
</div>

<ConfirmationModal
  open={showDeleteConfirm}
  title="Delete account"
  message="This will permanently delete your account, remove you from all margins, and anonymize your data. This cannot be undone."
  confirmLabel="Delete my account"
  variant="delete"
  onConfirm={onDeleteAccount}
  onClose={() => (showDeleteConfirm = false)}
/>

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

  .danger-zone {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1px solid rgba(192, 57, 43, 0.2);
    border-radius: 10px;
    background: rgba(192, 57, 43, 0.03);
  }

  .danger-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .danger-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: #c0392b;
  }

  .danger-description {
    font-size: 0.78rem;
    color: #888;
    line-height: 1.5;
  }
</style>
