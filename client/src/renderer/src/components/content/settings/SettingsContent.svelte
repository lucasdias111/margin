<script lang="ts">
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { userState } from '$src/states/UserState.svelte.js'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import EditIcon from '$src/components/svg/EditIcon.svelte'
  import { userService } from '$src/services/UserService'
  import { clickOutside } from '$src/actions/clickOutside'

  let newProfilePicture = $state<File | null>(null)
  let previewUrl = $state<string | null>(userState.currentUser.profilePictureUrl)
  let newNameDisplay = $state<string | null>(userState.currentUser.displayName)
  let newEmail = $state<string | null>(userState.currentUser.email)
  let isEditingDisplayName = $state(false)
  let isEditingEmail = $state(false)

  async function onFileChange(file: File): Promise<void> {
    newProfilePicture = file
  }

  async function onSave(): Promise<void> {
    try {
      const formData = new FormData()
      if (newNameDisplay) formData.append('displayName', newNameDisplay)
      if (newProfilePicture) formData.append('file', newProfilePicture)
      if (newEmail) formData.append('email', newEmail)
      await userService.updateUserInfo(formData)

      newNameDisplay = userState.currentUser.displayName
      newEmail = userState.currentUser.email
      previewUrl = userState.currentUser.profilePictureUrl
      isEditingEmail = false
      isEditingDisplayName = false
    } catch {
      // do nothing
    }
  }

  async function onPreviewUrlChange(url: string): Promise<void> {
    previewUrl = url
  }
</script>

<div class="content">
  <div class="picture">
    <UserAvatar profilePictureUrl={previewUrl} height={104} width={104} />
    <UploadImageButton {onFileChange} {onPreviewUrlChange} label="Change picture" />
  </div>

  <div class="info-change">
    <div class="field-row">
      {#if isEditingDisplayName}
        <input
          class="field-input"
          bind:value={newNameDisplay}
          use:clickOutside={() => (isEditingDisplayName = false)}
        />
      {:else}
        <div class="field-label">
          <span class="field-title">Display name</span>
          <span class="field-value">{userState.currentUser.displayName}</span>
        </div>
        <button class="edit-btn" onclick={() => (isEditingDisplayName = !isEditingDisplayName)}>
          <EditIcon />
        </button>
      {/if}
    </div>

    <div class="field-row">
      {#if isEditingEmail}
        <input
          class="field-input"
          bind:value={newEmail}
          use:clickOutside={() => (isEditingEmail = false)}
        />
      {:else}
        <div class="field-label">
          <span class="field-title">Email</span>
          <span class="field-value">{userState.currentUser.email}</span>
        </div>
        <button class="edit-btn" onclick={() => (isEditingEmail = !isEditingEmail)}>
          <EditIcon />
        </button>
      {/if}
    </div>
  </div>

  <button class="save-btn" onclick={() => onSave()}>Save</button>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 40px;
    background: white;
    border-radius: 20px;
    width: 100%;
  }

  .picture {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .info-change {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .field-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .field-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #f47e3a;
  }

  .field-value {
    padding-top: 10px;
    font-size: 15px;
    color: #676363;
  }

  .field-input {
    flex: 1;
    border: none;
    border-bottom: 1px solid #111;
    outline: none;
    font-size: 15px;
    padding: 4px 0;
    background: transparent;
  }

  .edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #aaa;
    padding: 4px;
  }

  .save-btn {
    align-self: flex-end;
    padding: 10px 28px;
    background: #f47e3a;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }
</style>
