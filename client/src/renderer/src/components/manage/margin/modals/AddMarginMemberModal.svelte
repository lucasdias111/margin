<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserSearchBar from '$src/components/common/user/UserSearchBar.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import type { User } from '$src/interfaces/User'

  interface Props {
    open: boolean
    onClose: () => void
    onAddMember: (user: User, role: string) => Promise<void>
  }

  let { open, onClose, onAddMember }: Props = $props()

  let memberToAdd = $state<User | undefined>(undefined)
  let initialTitle = 'Add Member To Margin'
  let title = $state<string>(initialTitle)

  const roles = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Owner', value: 'OWNER' }
  ]
  let selectedRole = $state(roles[0].value)

  async function handleSubmit(): Promise<void> {
    await onAddMember(memberToAdd, selectedRole)
    onClose()
    clear()
  }

  function handleCancel(): void {
    onClose()
    clear()
  }

  function clear(): void {
    memberToAdd = undefined
    title = initialTitle
    selectedRole = roles[0].value
  }

  function onSelectUser(user: User): void {
    memberToAdd = user
    title = `Add ${user.username} to margin?`
  }
</script>

<AppModal {open} {title} onClose={handleCancel}>
  {#if memberToAdd}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={memberToAdd.profilePictureUrl} />
      <span class="username">{memberToAdd.username}</span>
    </div>

    <div class="role-field">
      <label for="margin-member-role">Role</label>
      <select id="margin-member-role" bind:value={selectedRole}>
        {#each roles as role (role.value)}
          <option value={role.value}>{role.label}</option>
        {/each}
      </select>
    </div>
  {:else}
    <UserSearchBar {onSelectUser} />
  {/if}

  <div class="actions">
    <button class="cancel" onclick={handleCancel}>Cancel</button>
    <button class="confirm" onclick={handleSubmit} disabled={!memberToAdd}>Add</button>
  </div>
</AppModal>

<style>
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

  .selected-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #ffebe5;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .username {
    color: #2d2d2d;
    font-weight: 600;
    font-size: 14px;
  }

  .role-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 4px;
  }

  .role-field label {
    font-size: 13px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .role-field select {
    padding: 9px 14px;
    border-radius: 10px;
    border: 2px solid #e8e8e8;
    font-size: 14px;
    font-family: inherit;
    color: #2d2d2d;
    background: white;
    cursor: pointer;
    outline: none;
    appearance: none;
  }

  .role-field select:focus {
    border-color: #ff6203;
  }
</style>
