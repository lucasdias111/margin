<script lang="ts">
  import type { Space, SpaceMember } from '$src/interfaces/Space'
  import AddSpaceMemberModal from '$src/components/content/manage/spaces/modals/AddSpaceMemberModal.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import ListView from '$src/components/common/datatables/ListView.svelte'

  interface Props {
    selectedSpace: Space
    onAddMember: (user: SpaceMember) => Promise<void>
    onUpdateMemberRole: (member: SpaceMember) => Promise<void>
  }

  let { selectedSpace, onAddMember, onUpdateMemberRole }: Props = $props()
  let addMemberOpen = $state(false)

  const spaceRoles = ['MEMBER', 'ADMIN']

  function handleRoleSelectChange(member: SpaceMember, e: Event): void {
    const value = (e.currentTarget as HTMLSelectElement).value
    onUpdateMemberRole({ ...member, role: value })
  }
</script>

<div class="space-members">
  {#if selectedSpace}
    <div class="members-header">
      <h2>Members</h2>
      <button class="add-member-btn" onclick={() => (addMemberOpen = true)}>Add member</button>
    </div>
    <ListView
      columns={[
        {
          key: 'handle',
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
          label: 'Added date',
          flex: 1.5,
          sortable: true,
          render: (m) => formatTimestamp(m.joinedAt)
        }
      ]}
      rows={selectedSpace.members}
      getKey={(member) => member.user.id}
      searchPlaceholder="Search member"
      searchFilter={(member, query) => member.user.handle.toLowerCase().includes(query)}
      onAction={(member) => onUpdateMemberRole(member)}
      cellSnippets={{ role: roleCell }}
    />
  {/if}
</div>

{#snippet roleCell(member)}
  <select
    class="role-select"
    value={member.role}
    onchange={(e) => handleRoleSelectChange(member, e)}
  >
    {#each spaceRoles as role (role)}
      <option value={role}>{role}</option>
    {/each}
  </select>
{/snippet}

<AddSpaceMemberModal
  space={selectedSpace}
  open={addMemberOpen}
  onClose={() => (addMemberOpen = false)}
  {onAddMember}
/>

<style>
  .space-members {
    flex: 2;
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    color: #2d2d2d;
  }

  .members-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .members-header h2 {
    margin: 0;
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
