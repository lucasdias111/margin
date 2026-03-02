<script lang="ts">
  import type { Space, SpaceMember } from '$src/interfaces/Space'
  import AddSpaceMemberModal from '$src/components/manage/spaces/modals/AddSpaceMemberModal.svelte'
  import { formatTimestamp } from '$src/utils/DateUtils'
  import ListView from '$src/components/common/datatables/ListView.svelte'

  interface Props {
    selectedSpace: Space
    onAddMember: (user: SpaceMember) => Promise<void>
  }

  let { selectedSpace, onAddMember }: Props = $props()
  let addMemberOpen = $state(false)
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
          key: 'username',
          label: 'Member',
          flex: 1,
          sortable: true,
          render: (m) => m.user.username
        },
        {
          key: 'role',
          label: 'Role',
          flex: 1,
          sortable: true,
          render: (m) => m.role
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
      searchFilter={(member, query) => member.user.username.toLowerCase().includes(query)}
      onAction={(member) => console.log('action', member)}
    />
  {/if}
</div>

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
</style>
