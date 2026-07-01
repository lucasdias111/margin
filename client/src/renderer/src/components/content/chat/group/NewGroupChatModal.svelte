<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { authenticatedGet } from '$src/services/api'
  import { groupConversationService } from '$src/services/GroupConversationService'
  import type { User } from '$src/interfaces/User'

  interface Props {
    open: boolean
    onClose: () => void
  }

  let { open, onClose }: Props = $props()

  let email = $state('')
  let groupName = $state('')
  let foundUser = $state<User | undefined>(undefined)
  let foundUserEmail = $state('')
  let members = $state<{ user: User; email: string }[]>([])
  let loading = $state(false)
  let creating = $state(false)
  let error = $state<string | null>(null)
  let encryptionMode = $state<'standard' | 'secret'>('standard')
  const encrypted = $derived(encryptionMode === 'secret')

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
      foundUserEmail = email.trim()
    } catch (e) {
      error = `${e}. Try again.`
    } finally {
      loading = false
    }
  }

  function addMember(): void {
    if (!foundUser) return
    const alreadyAdded = members.some((m) => m.user.id === foundUser!.id)
    if (!alreadyAdded) {
      members = [...members, { user: foundUser, email: foundUserEmail }]
    }
    foundUser = undefined
    foundUserEmail = ''
    email = ''
    error = null
  }

  async function lookupAndAdd(): Promise<void> {
    await lookup()
    addMember()
  }

  function removeMember(userId: number): void {
    members = members.filter((m) => m.user.id !== userId)
  }

  async function createGroup(): Promise<void> {
    if (!groupName.trim() || members.length === 0) {
      error = 'Please add a group name and at least one member.'
      return
    }
    creating = true
    error = null
    try {
      const group = await groupConversationService.createGroupConversation(
        members.map((m) => m.email),
        groupName.trim(),
        encrypted
      )
      groupConversationService.selectGroupConversation(group)
      close()
    } catch {
      error = 'Failed to create group. Please try again.'
    } finally {
      creating = false
    }
  }

  function close(): void {
    onClose()
    reset()
  }

  function reset(): void {
    email = ''
    groupName = ''
    foundUser = undefined
    foundUserEmail = ''
    members = []
    error = null
    loading = false
    creating = false
    encryptionMode = 'standard'
  }
</script>

<AppModal {open} title={encrypted ? 'New Secret Group' : 'New Group Chat'} onClose={close}>
  <div class="form">
    <label class="field-label" for="group-name-input">Group name</label>
    <input
      id="group-name-input"
      class="text-input"
      type="text"
      placeholder="Enter group name..."
      bind:value={groupName}
      maxlength="100"
    />

    <div class="encryption-options">
      <label class="radio-option" class:selected={encryptionMode === 'standard'}>
        <input type="radio" name="group-enc" value="standard" bind:group={encryptionMode} />
        <span class="radio-content">
          <span class="radio-icon"><Icon name="messages" size={18} /></span>
          <span class="radio-text">
            <span class="radio-title">Standard</span>
            <span class="radio-hint">Messages stored on server</span>
          </span>
        </span>
      </label>
      <label class="radio-option" class:selected={encryptionMode === 'secret'}>
        <input type="radio" name="group-enc" value="secret" bind:group={encryptionMode} />
        <span class="radio-content">
          <span class="radio-icon"><Icon name="lock" size={18} /></span>
          <span class="radio-text">
            <span class="radio-title">Secret Group</span>
            <span class="radio-hint"
              >End-to-end encrypted (new members cannot be added after creation)</span
            >
          </span>
        </span>
      </label>
    </div>

    <div class="members-section">
      <label class="field-label" for="member-email-input">Add members</label>
      <div class="lookup-row">
        <input
          id="member-email-input"
          class="text-input"
          type="email"
          placeholder="Enter email address..."
          bind:value={email}
          maxlength="255"
          onkeydown={(e) => {
            if (e.key === 'Enter') lookupAndAdd()
          }}
        />
        <Button
          buttonType="secondary"
          size="small"
          onClick={lookupAndAdd}
          text="Add"
          disabled={loading || !email.trim()}
        />
      </div>

      {#if members.length > 0}
        <ul class="member-list">
          {#each members as member (member.user.id)}
            <li class="member-chip">
              <UserAvatar profilePictureUrl={member.user.profilePictureUrl} height={22} />
              <span class="chip-name">{member.user.displayName}</span>
              <button class="remove-btn" onclick={() => removeMember(member.user.id)}>×</button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    {#if error}
      <span class="lookup-error">{error}</span>
    {/if}

    <div class="actions">
      <button class="cancel" onclick={close}>Cancel</button>
      <button
        class="confirm"
        onclick={createGroup}
        disabled={creating || !groupName.trim() || members.length === 0}
      >
        {creating ? 'Creating…' : 'Create Group'}
      </button>
    </div>
  </div>
</AppModal>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .field-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
    margin-bottom: 2px;
  }

  .text-input {
    width: 100%;
    padding: 6px 10px;
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

  .text-input:focus {
    border-color: #ff843c;
    background: white;
  }

  .text-input::placeholder {
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
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .radio-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #f0f0f0;
    color: #888;
    flex-shrink: 0;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .radio-option.selected .radio-icon {
    background: #fff0e8;
    color: #e8712a;
  }

  .radio-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .radio-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: #2d2d2d;
  }

  .radio-hint {
    font-size: 0.78rem;
    color: #888;
  }

  .members-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lookup-row {
    display: flex;
    gap: 8px;
  }

  .member-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .member-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #fff0eb;
    border: 1px solid #ffd8c8;
    border-radius: 20px;
    padding: 3px 8px 3px 4px;
  }

  .chip-name {
    font-size: 12px;
    font-weight: 500;
    color: #2d2d2d;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #888;
    font-size: 14px;
    line-height: 1;
    padding: 0 2px;
    font-family: inherit;
  }

  .remove-btn:hover {
    color: #c0392b;
  }

  .lookup-error {
    font-size: 12px;
    color: #c0392b;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
  }

  .cancel {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    color: #2d2d2d;
    font-family: inherit;
    font-size: 13px;
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
    font-size: 13px;
  }

  .confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
