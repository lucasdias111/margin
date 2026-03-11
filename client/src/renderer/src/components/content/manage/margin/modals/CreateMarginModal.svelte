<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UploadImageButton from '$src/components/common/buttons/UploadImageButton.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import avatar from '$src/assets/pics/anonym-avatar.png'
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
  let icon = $state<File | null>(null)
  let previewUrl = $state<string | null>(avatar)

  async function handleSubmit(): Promise<void> {
    const newMargin = await marginService.createMargin(
      {
        marginName,
        marginDescription,
        visibility
      },
      icon
    )

    chatState.selectMargin(newMargin)
    marginName = ''
    marginDescription = ''
    icon = null
    previewUrl = avatar
    onClose()
  }
</script>

<AppModal {open} title="Create Margin" {onClose}>
  <div class="avatar-row">
    <UserAvatar profilePictureUrl={previewUrl} width={72} height={72} />
    <UploadImageButton
      onFileChange={async (file) => {
        icon = file
      }}
      onPreviewUrlChange={async (url) => {
        previewUrl = url
      }}
    />
  </div>

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
  .avatar-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

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
