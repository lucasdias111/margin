<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import { authenticatedGet } from '$src/services/api'
  import { chatService } from '$src/services/ChatService'
  import type { User } from '$src/interfaces/User'

  interface Props {
    open: boolean
    onClose: () => void
  }

  let { open, onClose }: Props = $props()

  let handle = $state('')
  let foundUser = $state<User | undefined>(undefined)
  let loading = $state(false)
  let error = $state<string | null>(null)
  let sent = $state(false)

  const initialTitle = 'Invite a user to chat'
  let title = $state(initialTitle)

  async function lookup(): Promise<void> {
    if (!handle.trim()) return
    loading = true
    error = null
    try {
      const response = await authenticatedGet(
        `users/lookup?handle=${encodeURIComponent(handle.trim())}`
      )
      if (!response.ok) {
        error = 'User not found.'
        return
      }
      foundUser = await response.json()
      title = `Send invite to ${foundUser!.displayName ?? foundUser!.handle}?`
    } catch (e) {
      error = `${e}. Try again.`
    } finally {
      loading = false
    }
  }

  async function sendInvite(): Promise<void> {
    if (!foundUser) return
    try {
      await chatService.sendConversationInvite(foundUser.handle)
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
    handle = ''
    foundUser = undefined
    error = null
    loading = false
    sent = false
    title = initialTitle
  }
</script>

<AppModal {open} {title} onClose={close}>
  {#if sent}
    <div class="success">
      <span
      >Invite sent to {foundUser?.displayName ?? foundUser?.handle}. They'll need to accept before
        you can chat.</span
      >
    </div>
    <div class="actions">
      <button class="confirm" onclick={close}>Done</button>
    </div>
  {:else if foundUser}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={foundUser.profilePictureUrl} />
      <span class="name">{foundUser.displayName ?? foundUser.handle}</span>
    </div>
    {#if error}
      <span class="lookup-error">{error}</span>
    {/if}
    <div class="actions">
      <button
        class="cancel"
        onclick={() => {
          foundUser = undefined
          title = initialTitle
        }}>Back
      </button
      >
      <button class="confirm" onclick={sendInvite}>Send Invite</button>
    </div>
  {:else}
    <div class="lookup">
      <label class="field-label" for="handle-input">Handle</label>
      <div class="lookup-row">
        <input
          id="handle-input"
          class="lookup-input"
          type="text"
          placeholder="Enter handle for user..."
          bind:value={handle}
          maxlength="100"
          onkeydown={(e) => {
            if (e.key === 'Enter') lookup()
          }}
        />
        <Button
          buttonType="primary"
          size="small"
          onClick={lookup}
          text="Find"
          disabled={loading || !handle.trim()}
        />
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
    gap: 8px;
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
    transition: border-color 0.15s,
    background 0.15s;
  }

  .lookup-input:focus {
    border-color: #f47e3a;
    background: white;
  }

  .lookup-input::placeholder {
    color: #c1c1c1;
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
    color: #2d2d2d;
    font-weight: 600;
    font-size: 14px;
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

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 5% 0 1%;
  }

  .cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    color: #2d2d2d;
    font-family: inherit;
  }

  .confirm {
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }
</style>
