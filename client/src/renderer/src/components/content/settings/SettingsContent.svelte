<script lang="ts">
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import { usersService } from '$src/services/UsersService'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { sessionState } from '$src/states/SessionState.svelte'

  let newProfilePicture = $state<File | null>(null)
  let previewUrl = $state<string | null>(sessionState.currentUser.profilePictureUrl)
  let displayName = $state(sessionState.currentUser.displayName)
  let email = $state(sessionState.currentUser.email)
  let editingField = $state<'displayName' | 'email' | null>(null)
  let showDeleteConfirm = $state(false)

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let passwordError = $state<string | null>(null)
  let passwordSuccess = $state(false)
  let passwordLoading = $state(false)

  const hasChanges = $derived(
    displayName !== sessionState.currentUser.displayName ||
    email !== sessionState.currentUser.email ||
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
      displayName = sessionState.currentUser.displayName
      email = sessionState.currentUser.email
      editingField = null
    }
  }

  function discardChanges(): void {
    displayName = sessionState.currentUser.displayName
    email = sessionState.currentUser.email
    previewUrl = sessionState.currentUser.profilePictureUrl
    newProfilePicture = null
    editingField = null
  }

  async function onSave(): Promise<void> {
    try {
      const formData = new FormData()
      if (displayName !== sessionState.currentUser.displayName)
        formData.append('displayName', displayName)
      if (email !== sessionState.currentUser.email) formData.append('email', email)
      if (newProfilePicture) formData.append('file', newProfilePicture)
      await usersService.updateUserInfo(formData)

      displayName = sessionState.currentUser.displayName
      email = sessionState.currentUser.email
      previewUrl = sessionState.currentUser.profilePictureUrl
      newProfilePicture = null
      editingField = null
    } catch {
      // do nothing
    }
  }

  async function onChangePassword(): Promise<void> {
    passwordError = null
    passwordSuccess = false

    if (newPassword.length < 8) {
      passwordError = 'New password must be at least 8 characters.'
      return
    }
    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match.'
      return
    }

    passwordLoading = true
    try {
      await usersService.changePassword(currentPassword, newPassword)
      passwordSuccess = true
      currentPassword = ''
      newPassword = ''
      confirmPassword = ''
    } catch {
      passwordError = 'Incorrect current password or something went wrong.'
    } finally {
      passwordLoading = false
    }
  }

  async function onDeleteAccount(): Promise<void> {
    try {
      await usersService.deleteAccount()
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

    <h2 class="page-title">Change password</h2>

    <div class="password-fields">
      <div class="password-field">
        <label class="field-label" for="current-password">Current password</label>
        <input
          id="current-password"
          class="field-input-standalone"
          type="password"
          bind:value={currentPassword}
          autocomplete="current-password"
        />
      </div>
      <div class="password-field">
        <label class="field-label" for="new-password">New password</label>
        <input
          id="new-password"
          class="field-input-standalone"
          type="password"
          bind:value={newPassword}
          autocomplete="new-password"
        />
      </div>
      <div class="password-field">
        <label class="field-label" for="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          class="field-input-standalone"
          type="password"
          bind:value={confirmPassword}
          autocomplete="new-password"
        />
      </div>
      {#if passwordError}
        <span class="password-error">{passwordError}</span>
      {/if}
      {#if passwordSuccess}
        <span class="password-success">Password changed successfully.</span>
      {/if}
    </div>

    <div class="actions">
      <Button
        buttonType="primary"
        size="small"
        text={passwordLoading ? 'Saving…' : 'Change password'}
        disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
        onClick={onChangePassword}
      />
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

  .password-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .password-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .field-input-standalone {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1.5px solid #ebebeb;
    background: #fafafa;
    font-family: inherit;
    font-size: 0.9rem;
    color: #333;
    outline: none;
    transition: border-color 0.15s, background 0.15s;
  }

  .field-input-standalone:focus {
    border-color: #f47e3a;
    background: white;
  }

  .password-error {
    font-size: 0.8rem;
    color: #c0392b;
  }

  .password-success {
    font-size: 0.8rem;
    color: #3d8a52;
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
