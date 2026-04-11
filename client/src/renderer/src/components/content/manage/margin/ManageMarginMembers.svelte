<script lang="ts">
  import { type Margin, type MarginMember, MarginRole } from '$src/interfaces/Margin'
  import AddMarginMemberModal from '$src/components/content/manage/margin/modals/AddMarginMemberModal.svelte'
  import ListView from '$src/components/common/datatables/ListView.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import type { User } from '$src/interfaces/User'
  import { userState } from '$src/states/UserState.svelte'
  import { roleRank } from '$src/interfaces/Margin'
  import { errorService } from '$src/services/ErrorService'
  import { marginInviteService } from '$src/services/MarginInviteService'
  import Button from '$src/components/common/buttons/Button.svelte'

  interface Props {
    margin: Margin
    onInviteUser: (user: User) => Promise<void>
    onUpdateMemberRole: (member: MarginMember) => Promise<void>
    onRemoveMember: (member: MarginMember) => Promise<void>
  }

  let { margin, onInviteUser, onUpdateMemberRole, onRemoveMember }: Props = $props()
  let addMemberOpen = $state(false)
  let inviteLink = $state<string | null>(null)
  let inviteLoading = $state(false)
  const marginRoles = Object.values(MarginRole)

  async function handleCreateInviteLink(): Promise<void> {
    inviteLoading = true
    try {
      const result = await marginInviteService.createLinkInvite(margin.marginId)
      inviteLink = result.inviteCode
    } catch (e) {
      console.error('Failed to create invite link:', e)
    } finally {
      inviteLoading = false
    }
  }

  function copyInviteLink(): void {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
  }

  function handleRoleSelectChange(member: MarginMember, e: Event): void {
    const value = (e.currentTarget as HTMLSelectElement).value as MarginRole
    if (
      roleRank[value] > roleRank[member.role] &&
      member.user?.id === userState.currentUser?.id &&
      margin.members.filter((m) => m.role === 'ADMIN').length === 1
    )
      return errorService.reportError(`At least one admin is required.`)
    onUpdateMemberRole({ ...member, role: value })
  }
</script>

{#if margin.members.length !== 0}
  <div class="margin-members">
    <div class="members-header">
      <h2>Members</h2>
      <div class="header-actions">
        <Button
          buttonType="primary"
          size="small"
          onClick={handleCreateInviteLink}
          disabled={inviteLoading}
          text={inviteLoading ? 'Generating...' : 'Create invite link'}
        />
        <Button
          buttonType="secondary"
          size="small"
          onClick={() => (addMemberOpen = true)}
          text="Invite by handle"
        />
      </div>
    </div>

    {#if inviteLink}
      <div class="invite-link-bar">
        <span class="invite-label">Invite code</span>
        <div class="invite-link-row">
          <input class="invite-code-input" type="text" value={inviteLink} readonly />
          <Button buttonType="primary" size="small" onClick={copyInviteLink} text="Copy" />
          <button class="dismiss-btn" onclick={() => (inviteLink = null)}>✕</button>
        </div>
        <span class="invite-expiry">Expires in 7 days</span>
      </div>
    {/if}

    {#snippet roleCell(member)}
      <select
        class="role-select"
        bind:value={member.role}
        onchange={(e) => handleRoleSelectChange(member, e)}
      >
        {#each marginRoles as role (role)}
          <option value={role}>{role}</option>
        {/each}
      </select>
    {/snippet}

    <ListView
      columns={[
        {
          key: 'displayName',
          label: 'Member',
          flex: 1,
          sortable: true,
          render: (m) => m.user.displayName
        },
        {
          key: 'role',
          label: 'Role',
          flex: 1
        },
        {
          key: 'joinedAt',
          label: 'Joined',
          flex: 1.5,
          sortable: true,
          render: (m) => formatTimestamp(m.joinedAt)
        }
      ]}
      rows={margin.members}
      getKey={(m) => m.user.id}
      onAction={(m) => onRemoveMember(m)}
      searchPlaceholder="Search member"
      searchFilter={(m, q) => m.user.handle.toLowerCase().includes(q)}
      cellSnippets={{ role: roleCell }}
    />
  </div>
{/if}

<AddMarginMemberModal open={addMemberOpen} onClose={() => (addMemberOpen = false)} {onInviteUser} />

<style>
  .margin-members {
    flex: 2;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    color: #2d2d2d;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .members-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .role-select {
    padding: 5px 10px;
    border-radius: 6px;
    border: 1px solid #d9d9d9;
    font-size: 0.85rem;
    font-family: inherit;
    color: #2d2d2d;
    background: white;
    cursor: pointer;
    outline: none;
  }

  .role-select:focus {
    border-color: #f5a623;
  }

  .invite-link-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: #fff8f4;
    border: 1px solid rgba(232, 113, 42, 0.15);
    border-radius: 10px;
  }

  .invite-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }

  .invite-link-row {
    display: flex;
    gap: 6px;
  }

  .invite-code-input {
    flex: 1;
    padding: 7px 12px;
    border-radius: 8px;
    border: 1px solid #ece8e0;
    background: white;
    font-family: monospace;
    font-size: 13px;
    color: #2a2a2a;
    outline: none;
  }

  .dismiss-btn {
    padding: 3px 10px;
    background: none;
    border: 1px solid #ddd;
    border-radius: 8px;
    color: #888;
    cursor: pointer;
    font-size: 8px;
  }

  .invite-expiry {
    font-size: 11px;
    color: #aaa;
  }
</style>
