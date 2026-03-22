<script lang="ts">
  import AppModal from '$src/components/common/modals/AppModal.svelte'
  import UserSearchBar from '$src/components/common/user/UserSearchBar.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { spaceState } from '$src/states/SpaceState.svelte.js'
  import { spacesService } from '$src/services/SpacesService'
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

  const marginRoles = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Owner', value: 'OWNER' }
  ]

  const spaceRoles = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Admin', value: 'ADMIN' }
  ]

  let selectedRole = $state(marginRoles[0].value)
  let addToSpaces = $state(false)

  interface SpaceSelection {
    spaceId: number
    spaceName: string
    selected: boolean
    role: string
  }

  const spaceSelections = $derived<SpaceSelection[]>(
    spaceState.spaces.map((s) => ({
      spaceId: s.spaceId,
      spaceName: s.spaceName,
      selected: false,
      role: spaceRoles[0].value
    }))
  )

  let spaceSelectionState = $state<SpaceSelection[]>([])

  $effect(() => {
    if (addToSpaces && spaceSelectionState.length === 0) {
      spaceSelectionState = spaceState.spaces.map((s) => ({
        spaceId: s.spaceId,
        spaceName: s.spaceName,
        selected: false,
        role: spaceRoles[0].value
      }))
    }
  })

  async function handleSubmit(): Promise<void> {
    if (!memberToAdd) return
    await onAddMember(memberToAdd, selectedRole)

    if (addToSpaces) {
      const selectedSpaces = spaceSelectionState.filter((s) => s.selected)
      await Promise.all(
        selectedSpaces.map((s) =>
          spacesService.addSpaceMemberToSpace({
            user: memberToAdd!,
            spaceId: s.spaceId,
            role: s.role,
            joinedAt: new Date().toISOString()
          })
        )
      )
    }

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
    selectedRole = marginRoles[0].value
    addToSpaces = false
    spaceSelectionState = []
  }

  function onSelectUser(user: User): void {
    memberToAdd = user
    title = `Add ${user.displayName} to margin?`
  }

  function toggleSpace(spaceId: number): void {
    spaceSelectionState = spaceSelectionState.map((s) =>
      s.spaceId === spaceId ? { ...s, selected: !s.selected } : s
    )
  }

  function updateSpaceRole(spaceId: number, role: string): void {
    spaceSelectionState = spaceSelectionState.map((s) =>
      s.spaceId === spaceId ? { ...s, role } : s
    )
  }
</script>

<AppModal {open} {title} onClose={handleCancel}>
  {#if memberToAdd}
    <div class="selected-user">
      <UserAvatar profilePictureUrl={memberToAdd.profilePictureUrl} />
      <span class="username">{memberToAdd.displayName}</span>
    </div>

    <div class="role-field">
      <label for="margin-member-role">Margin Role</label>
      <select id="margin-member-role" bind:value={selectedRole}>
        {#each marginRoles as role (role.value)}
          <option value={role.value}>{role.label}</option>
        {/each}
      </select>
    </div>

    {#if spaceState.spaces.length > 0}
      <div class="space-toggle">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={addToSpaces} />
          <span>Also add to spaces</span>
        </label>
      </div>

      {#if addToSpaces}
        <div class="spaces-list">
          {#each spaceSelectionState as space (space.spaceId)}
            <div class="space-row" class:selected={space.selected}>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={space.selected}
                  onchange={() => toggleSpace(space.spaceId)}
                />
                <span class="space-name">{space.spaceName}</span>
              </label>

              {#if space.selected}
                <select
                  value={space.role}
                  onchange={(e) => updateSpaceRole(space.spaceId, (e.currentTarget as HTMLSelectElement).value)}
                >
                  {#each spaceRoles as role (role.value)}
                    <option value={role.value}>{role.label}</option>
                  {/each}
                </select>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
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
    margin-bottom: 12px;
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

  .space-toggle {
    margin-bottom: 12px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #2d2d2d;
  }

  .checkbox-label input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: #ff6203;
    cursor: pointer;
  }

  .spaces-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid #ece8e0;
    border-radius: 10px;
    padding: 8px;
  }

  .space-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 8px;
    transition: background 0.12s;
  }

  .space-row.selected {
    background: #ffebe5;
  }

  .space-name {
    font-size: 14px;
    color: #2d2d2d;
  }

  .space-row select {
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    font-size: 13px;
    font-family: inherit;
    color: #2d2d2d;
    background: white;
    cursor: pointer;
    outline: none;
    appearance: none;
  }

  .space-row select:focus {
    border-color: #ff6203;
  }
</style>
