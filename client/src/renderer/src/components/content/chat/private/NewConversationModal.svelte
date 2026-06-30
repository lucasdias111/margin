<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { authenticatedGet } from '$src/services/api'
  import { chatService } from '$src/services/ChatService'
  import type { User } from '$src/interfaces/User'

  interface Props {
    open: boolean
    onClose: () => void
  }

  let { open, onClose }: Props = $props()

  let email = $state('')
  let foundUser = $state<User | undefined>(undefined)
  let loading = $state(false)
  let error = $state<string | null>(null)
  let sent = $state(false)
  let encryptionMode = $state<'standard' | 'secret'>('standard')
  const encrypted = $derived(encryptionMode === 'secret')

  const title = $derived(
    foundUser
      ? `Send invite to ${foundUser.displayName}?`
      : encrypted
        ? 'New Secret Chat'
        : 'New Private Chat'
  )

  async function lookup(): Promise<void> {
    if (!email.trim()) return
    loading = true
    error = null
    try {
      const response = await authenticatedGet(
        `users/lookup?email=${encodeURIComponent(email.trim())}`
      )
      if (!response.ok) {
        error = 'User not found.'
        return
      }
      foundUser = await response.json()
    } catch (e) {
      error = `${e}. Try again.`
    } finally {
      loading = false
    }
  }

  async function sendInvite(): Promise<void> {
    if (!foundUser) return
    try {
      await chatService.sendConversationInvite(email.trim(), encrypted)
      sent = true
    } catch {
      error = 'Failed to send invite. The user may already have a conversation with you.'
    }
  }

  function close(): void {
    onClose()
    reset()
  }

  function reset(): void {
    email = ''
    foundUser = undefined
    error = null
    loading = false
    sent = false
    encryptionMode = 'standard'
  }
</script>

<AppModal {open} {title} onClose={close}>
  {#if sent}
    <div class="success">
      <span
        >Invite sent to {foundUser?.displayName}. They'll need to accept before you can chat.</span
      >
      {#if encrypted}
        <p class="enc-note">
          <Icon name="lock" size={12} />
          This will be a Secret Chat — end-to-end encrypted.
        </p>
      {/if}
    </div>
    <div class="actions">
      <Button buttonType="primary" onClick={close} text="Done" />
    </div>
  {:else if foundUser}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={foundUser.profilePictureUrl} />
      <span class="name">{foundUser.displayName}</span>
      {#if encrypted}
        <span class="secret-badge">
          <Icon name="lock" size={11} />
          Secret
        </span>
      {/if}
    </div>
    {#if error}
      <span class="lookup-error">{error}</span>
    {/if}
    <div class="actions">
      <Button
        buttonType="secondary"
        onClick={() => {
          foundUser = undefined
        }}
        size="medium"
        text="Back"
      />
      <Button
        buttonType="primary"
        onClick={sendInvite}
        size="medium"
        text="Send Invite"
      />
    </div>
  {:else}
    <div class="lookup">
      <label class="field-label" for="email-input">Email</label>
      <div class="lookup-row">
        <input
          id="email-input"
          class="lookup-input"
          type="email"
          placeholder="Enter email for user..."
          bind:value={email}
          maxlength="255"
          onkeydown={(e) => {
            if (e.key === 'Enter') lookup()
          }}
        />
        <Button
          buttonType="primary"
          size="small"
          onClick={lookup}
          text="Find"
          disabled={loading || !email.trim()}
        />
      </div>

      <div class="encryption-options">
        <label class="radio-option" class:selected={encryptionMode === 'standard'}>
          <input type="radio" name="chat-enc" value="standard" bind:group={encryptionMode} />
          <span class="radio-content">
            <span class="radio-title">Standard</span>
            <span class="radio-hint">Messages stored on server</span>
          </span>
        </label>
        <label class="radio-option" class:selected={encryptionMode === 'secret'}>
          <input type="radio" name="chat-enc" value="secret" bind:group={encryptionMode} />
          <span class="radio-content">
            <span class="radio-title"><Icon name="lock" size={11} /> Secret Chat</span>
            <span class="radio-hint">End-to-end encrypted</span>
          </span>
        </label>
      </div>

      {#if error}
        <span class="lookup-error">{error}</span>
      {/if}
    </div>
  {/if}
</AppModal>

<style>
  .lookup {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }

  .lookup-row {
    display: flex;
    gap: 8px;
  }

  .lookup-input {
    flex: 1;
    padding: 4px 8px;
    border-radius: 10px;
    border: 1.5px solid #ebebeb;
    background: #fafafa;
    outline: none;
    font-family: inherit;
    font-size: 13px;
    color: #2a2a2a;
    box-sizing: border-box;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .lookup-input:focus {
    border-color: #ff843c;
    background: white;
  }

  .lookup-input::placeholder {
    color: #c1c1c1;
  }

  .encryption-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .radio-option {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1.5px solid #e8e8e8;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .radio-option.selected {
    border-color: #e8712a;
    background: #fff8f4;
  }

  .radio-option input[type='radio'] {
    display: none;
  }

  .radio-content {
    display: contents;
  }

  .radio-title {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #2d2d2d;
  }

  .radio-hint {
    font-size: 0.78rem;
    color: #888;
  }

  .lookup-error {
    font-size: 12px;
    color: #c0392b;
  }

  .selected-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #ffebe5;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .name {
    flex: 1;
    color: #2d2d2d;
    font-weight: 600;
    font-size: 14px;
  }

  .secret-badge {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    color: #ff6203;
    background: #fff0eb;
    border: 1px solid #ffd8c8;
    border-radius: 12px;
    padding: 2px 8px;
  }

  .success {
    padding: 14px 16px;
    background: #eef6ee;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #3d8a52;
    margin-bottom: 8px;
  }

  .enc-note {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 6px 0 0;
    font-size: 11px;
    color: #555;
    font-weight: 400;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 5% 0 1%;
  }

</style>
