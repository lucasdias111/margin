<script lang="ts">
  import { type Margin, type MarginMember, MarginRole } from '$src/interfaces/Margin'
  import AddMarginMemberModal from '$src/components/manage/margin/modals/AddMarginMemberModal.svelte'
  import ListView from '$src/components/common/datatables/ListView.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import type { User } from '$src/interfaces/User'
  import { onMount } from 'svelte'

  interface Props {
    margin: Margin
    onAddMember: (user: User, role: string) => Promise<void>
    onUpdateMemberRole: (member: MarginMember) => Promise<void>
    onRemoveMember: (member: MarginMember) => Promise<void>
  }

  let { margin, onAddMember, onUpdateMemberRole, onRemoveMember }: Props = $props()

  let addMemberOpen = $state(false)

  const marginRoles = Object.values(MarginRole)

  onMount(() => {
    console.log('margin', margin)
  })

  function handleRoleSelectChange(member: MarginMember, e: Event): void {
    const value = (e.currentTarget as HTMLSelectElement).value as MarginRole
    onUpdateMemberRole({ ...member, role: value })
  }
</script>

{#if margin.members.length !== 0}
  <div class="margin-members">
    <div class="members-header">
      <h2>Members</h2>
      <button class="add-member-btn" onclick={() => (addMemberOpen = true)}>Add member</button>
    </div>

    {#snippet roleCell(member)}
      <select
        class="role-select"
        value={member.role}
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
        key: 'username',
        label: 'Member',
        flex: 1,
        sortable: true,
        render: (m) => m.user.username
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
      searchFilter={(m, q) => m.user.username.toLowerCase().includes(q)}
      cellSnippets={{ role: roleCell }}
    />
  </div>
{/if}

<AddMarginMemberModal open={addMemberOpen} onClose={() => (addMemberOpen = false)} {onAddMember} />

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

  .members-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .add-member-btn {
    background: #2d2d2d;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 9px 18px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
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
</style>
