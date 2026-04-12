<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { User } from '$src/interfaces/User'

  interface Props {
    open: boolean
    onClose: () => void
    onInviteUser: (user: User) => Promise<void>
  }

  let { open, onClose, onInviteUser }: Props = $props()

  let userToInvite = $state<User | undefined>(undefined)
  let exactHandle = $state('')
  let exactLookupLoading = $state(false)
  let exactLookupError = $state<string | null>(null)
  let inviteSent = $state(false)

  const initialTitle = 'Invite User To Margin'
  let title = $state<string>(initialTitle)

  async function handleExactLookup(): Promise<void> {
    if (!exactHandle.trim()) return
    exactLookupLoading = true
    exactLookupError = null

    try {
      const response = await authenticatedGet(
        `users/lookup?handle=${encodeURIComponent(exactHandle.trim())}`
      )
      if (!response.ok) {
        exactLookupError = 'User not found.'
        return
      }
      const user: User = await response.json()
      userToInvite = user
      title = `Invite ${user.displayName ?? user.handle} to margin?`
    } catch (e) {
      exactLookupError = 'Lookup failed. Try again.'
    } finally {
      exactLookupLoading = false
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!userToInvite) return
    try {
      await onInviteUser(userToInvite)
      inviteSent = true
    } catch (e) {
      exactLookupError = 'Failed to send invite.'
    }
  }

  function handleCancel(): void {
    onClose()
    clear()
  }

  function clear(): void {
    userToInvite = undefined
    title = initialTitle
    exactHandle = ''
    exactLookupError = null
    exactLookupLoading = false
    inviteSent = false
  }
</script>

<AppModal {open} {title} onClose={handleCancel}>
  {#if inviteSent}
    <div class="success-message">
      <span>Invite sent to {userToInvite?.displayName ?? userToInvite?.handle}.</span>
    </div>
    <div class="actions">
      <button class="confirm" onclick={handleCancel}>Done</button>
    </div>
  {:else if userToInvite}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={userToInvite.profilePictureUrl} />
      <span class="handle">{userToInvite.displayName ?? userToInvite.handle}</span>
    </div>

    {#if exactLookupError}
      <span class="lookup-error">{exactLookupError}</span>
    {/if}

    <div class="actions">
      <button class="cancel" onclick={() => { userToInvite = undefined; title = initialTitle }}>Back</button>
      <button class="confirm" onclick={handleSubmit}>Send Invite</button>
    </div>
  {:else}
    <div class="exact-lookup">
      <label class="field-label" for="exact-handle">Enter exact handle</label>
      <div class="lookup-row">
        <input
          id="exact-handle"
          class="lookup-input"
          type="text"
          placeholder="handle"
          bind:value={exactHandle}
          maxlength="100"
          onkeydown={(e) => {
            if (e.key === 'Enter') handleExactLookup()
          }}
        />
        <button
          class="lookup-btn"
          onclick={handleExactLookup}
          disabled={exactLookupLoading || !exactHandle.trim()}
        >
          {#if exactLookupLoading}
            <span class="spinner"></span>
          {:else}
            Find
          {/if}
        </button>
      </div>
      {#if exactLookupError}
        <span class="lookup-error">{exactLookupError}</span>
      {/if}
    </div>

    <div class="actions">
      <button class="cancel" onclick={handleCancel}>Cancel</button>
    </div>
  {/if}
</AppModal>

<style>
  .exact-lookup {
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
    padding: 8px 14px;
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
    border-color: #f47e3a;
    background: white;
  }

  .lookup-input::placeholder {
    color: #c1c1c1;
  }

  .lookup-btn {
    padding: 8px 16px;
    background: #f47e3a;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
  }

  .lookup-btn:hover:not(:disabled) {
    background: #e06b28;
  }

  .lookup-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .lookup-error {
    font-size: 12px;
    color: #c0392b;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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

  .handle {
    color: #2d2d2d;
    font-weight: 600;
    font-size: 14px;
  }

  .success-message {
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
    padding: 5% 0 1% 0;
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

  .confirm:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
