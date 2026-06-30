<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { authenticatedGet } from '$src/services/api'
  import { chatService } from '$src/services/ChatService'
  import type { User } from '$src/interfaces/User'
  import type { GroupConversation } from '$src/interfaces/Conversation'

  interface Props {
    open: boolean
    group: GroupConversation
    onClose: () => void
  }

  let { open, group, onClose }: Props = $props()

  let email = $state('')
  let foundUser = $state<User | undefined>(undefined)
  let loading = $state(false)
  let adding = $state(false)
  let error = $state<string | null>(null)
  let done = $state(false)

  function reset(): void {
    email = ''
    foundUser = undefined
    loading = false
    adding = false
    error = null
    done = false
  }

  function handleClose(): void {
    reset()
    onClose()
  }

  async function lookup(): Promise<void> {
    if (!email.trim()) return
    loading = true
    error = null
    foundUser = undefined
    try {
      const response = await authenticatedGet(
        `users/lookup?email=${encodeURIComponent(email.trim())}`
      )
      if (!response.ok) {
        error = 'User not found.'
        return
      }
      foundUser = await response.json()
      if (group.memberIds.includes(foundUser!.id)) {
        error = 'This user is already a member of the group.'
        foundUser = undefined
      }
    } catch (e) {
      error = `${e}. Try again.`
    } finally {
      loading = false
    }
  }

  async function addMember(): Promise<void> {
    if (!foundUser) return
    adding = true
    error = null
    try {
      await chatService.addGroupMember(group.id, foundUser.id)
      done = true
    } catch {
      error = 'Failed to add member. Try again.'
    } finally {
      adding = false
    }
  }
</script>

<AppModal
  {open}
  title={done ? 'Member added' : `Add member to ${group.name}`}
  onClose={handleClose}
>
  {#if done}
    <div class="done-state">
      <p>Successfully added <strong>{foundUser?.displayName}</strong> to the group.</p>
      <Button buttonType="primary" size="small" onClick={reset} text="Add another" />
    </div>
  {:else}
    <div class="lookup">
      <div class="lookup-row">
        <input
          class="lookup-input"
          type="email"
          placeholder="Email address"
          bind:value={email}
          onkeydown={(e) => e.key === 'Enter' && lookup()}
        />
        <Button
          buttonType="secondary"
          size="small"
          onClick={lookup}
          disabled={loading}
          text={loading ? '…' : 'Find'}
        />
      </div>

      {#if foundUser}
        <div class="found-user">
          <UserAvatar profilePictureUrl={foundUser.profilePictureUrl} width={32} height={32} />
          <span class="found-name">{foundUser.displayName}</span>
          <Button
            buttonType="primary"
            size="small"
            onClick={addMember}
            disabled={adding}
            text={adding ? 'Adding…' : 'Add to group'}
          />
        </div>
      {/if}

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

  .found-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #f9f9f9;
    border-radius: 10px;
    border: 1.5px solid #ebebeb;
  }

  .found-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #2a2a2a;
  }

  .lookup-error {
    font-size: 12px;
    color: #d64545;
  }

  .done-state {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .done-state p {
    margin: 0;
    font-size: 13px;
    color: #2a2a2a;
  }
</style>
