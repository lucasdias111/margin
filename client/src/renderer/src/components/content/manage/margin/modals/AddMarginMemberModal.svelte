<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { authenticatedGet } from '$src/services/api'
  import type { User } from '$src/interfaces/User'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    onInviteUser: (email: string) => Promise<void>
  }

  let { open, onClose, onInviteUser }: Props = $props()

  let userToInvite = $state<User | undefined>(undefined)
  let exactEmail = $state('')
  let exactLookupLoading = $state(false)
  let exactLookupError = $state<string | null>(null)
  let inviteSent = $state(false)

  const initialTitle = 'Invite User To Margin'
  let title = $state<string>(initialTitle)

  async function handleExactLookup(): Promise<void> {
    if (!exactEmail.trim()) return
    exactLookupLoading = true
    exactLookupError = null

    try {
      const response = await authenticatedGet(
        `users/lookup?email=${encodeURIComponent(exactEmail.trim())}`
      )
      if (!response.ok) {
        exactLookupError = 'User not found.'
        return
      }
      const user: User = await response.json()
      userToInvite = user
      title = `Invite ${user.displayName} to margin?`
    } catch (e) {
      exactLookupError = 'Lookup failed. Try again.'
    } finally {
      exactLookupLoading = false
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!userToInvite) return
    try {
      await onInviteUser(exactEmail.trim())
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
    exactEmail = ''
    exactLookupError = null
    exactLookupLoading = false
    inviteSent = false
  }
</script>

<AppModal {open} {title} onClose={handleCancel}>
  {#if inviteSent}
    <div class="success-message">
      <span>Invite sent to {userToInvite?.displayName}.</span>
    </div>
    <div class="actions">
      <button class="confirm" onclick={handleCancel}>Done</button>
    </div>
  {:else if userToInvite}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={userToInvite.profilePictureUrl} />
      <span class="handle">{userToInvite.displayName}</span>
    </div>

    {#if exactLookupError}
      <span class="lookup-error">{exactLookupError}</span>
    {/if}

    <div class="actions">
      <button
        class="cancel"
        onclick={() => {
          userToInvite = undefined
          title = initialTitle
        }}>Back</button
      >
      <button class="confirm" onclick={handleSubmit}>Send Invite</button>
    </div>
  {:else}
    <div class="exact-lookup">
      <label class="field-label" for="exact-email">Enter exact email</label>
      <div class="lookup-row">
        <input
          id="exact-email"
          class="lookup-input"
          type="email"
          placeholder="email"
          bind:value={exactEmail}
          maxlength="255"
          onkeydown={(e) => {
            if (e.key === 'Enter') handleExactLookup()
          }}
        />
        <Button
          buttonType="primary"
          size="small"
          onClick={() => handleExactLookup()}
          text="Find"
          disabled={exactLookupLoading || !exactEmail.trim()}
        />

        {#if exactLookupLoading}
          <Spinner size={14} color="#ffffff" />
        {/if}
      </div>
      {#if exactLookupError}
        <span class="lookup-error">{exactLookupError}</span>
      {/if}
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
