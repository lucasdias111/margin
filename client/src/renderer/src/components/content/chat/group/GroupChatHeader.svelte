<script lang="ts">
  import ChatHeaderShell from '$src/components/common/chat/ChatHeaderShell.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import Button from '$src/components/common/buttons/Button.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import AddGroupMemberModal from '$src/components/content/chat/group/AddGroupMemberModal.svelte'
  import ConfirmationModal from '$src/components/common/modals/ConfirmationModal.svelte'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { groupConversationService } from '$src/services/GroupConversationService'
  import { usersState } from '$src/states/UsersState.svelte'
  import { usersService } from '$src/services/UsersService'
  import { clickOutside } from '$src/actions/clickOutside'
  import Tooltip from '$src/components/common/Tooltip.svelte'
  import Spinner from '$src/components/common/Spinner.svelte'
  import type { GroupConversation } from '$src/interfaces/Conversation'
  import type { User } from '$src/interfaces/User'

  interface Props {
    group: GroupConversation
  }

  let { group }: Props = $props()

  let addMemberOpen = $state(false)
  let leaveConfirmOpen = $state(false)
  let leavePending = $state(false)
  let membersOpen = $state(false)
  let members = $state<User[]>([])
  let pendingMembers = $state<User[]>([])
  let loadingMembers = $state(false)

  function handleBack(): void {
    navigationState.selectedGroupConversation = null
  }

  async function confirmLeave(): Promise<void> {
    leaveConfirmOpen = false
    leavePending = true
    try {
      await groupConversationService.leaveGroup(group.id)
    } finally {
      leavePending = false
    }
  }

  async function openMembers(): Promise<void> {
    membersOpen = !membersOpen
    if (!membersOpen) return
    loadingMembers = true
    try {
      const resolve = (id: number): Promise<Awaited<User>> => {
        const cached = usersState.byId.get(id)
        return cached ? Promise.resolve(cached) : usersService.getById(id)
      }
      ;[members, pendingMembers] = await Promise.all([
        Promise.all(group.memberIds.map(resolve)),
        Promise.all(group.pendingMemberIds.map(resolve))
      ])
    } finally {
      loadingMembers = false
    }
  }
</script>

<div class="header-wrapper">
  <ChatHeaderShell onBack={handleBack} identity={group.id}>
    {#snippet left()}
      <div class="group-avatar">
        <Icon name="users" size={16} />
      </div>
      <div class="group-info">
        <div class="name-row">
          <span class="name">{group.name}</span>
          {#if group.encrypted}
            <Tooltip
              text="End-to-end encrypted: only chat members can read these messages"
              position="bottom"
            >
              <span class="secret-badge">Secret</span>
            </Tooltip>
          {/if}
        </div>
        <button class="member-count-btn" onclick={openMembers}>
          {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}{group
            .pendingMemberIds.length > 0
            ? `, ${group.pendingMemberIds.length} pending`
            : ''}
          <span class="count-chevron" class:open={membersOpen}>
            <Icon name="chevronDown" size={10} />
          </span>
        </button>
      </div>
    {/snippet}

    {#snippet right()}
      <div class="action-group">
        <Tooltip
          text={group.encrypted ? 'New members cannot be added to secret groups' : ''}
          position="bottom"
        >
          <Button
            buttonType="secondary"
            size="small"
            disabled={group.encrypted}
            onClick={() => (addMemberOpen = true)}
          >
            <Icon name="userPlus" size={14} />
          </Button>
        </Tooltip>

        <Button
          buttonType="danger"
          size="small"
          disabled={leavePending}
          onClick={() => (leaveConfirmOpen = true)}
        >
          <Icon name="doorOut" size={14} />
        </Button>
      </div>
    {/snippet}
  </ChatHeaderShell>

  {#if membersOpen}
    <div class="members-dropdown" use:clickOutside={() => (membersOpen = false)}>
      {#if loadingMembers}
        <div class="members-loading">
          <Spinner />
        </div>
      {:else}
        {#each members as member (member.id)}
          <div class="member-row">
            <div class="member-avatar">
              {#if member.profilePictureUrl}
                <UserAvatar profilePictureUrl={member.profilePictureUrl} width={28} height={28} />
              {:else}
                <span class="avatar-initials">{member.displayName.slice(0, 2).toUpperCase()}</span>
              {/if}
              <span class="presence-dot" class:online={member.isOnline}></span>
            </div>
            <span class="member-name">{member.displayName}</span>
            {#if member.isOnline}
              <span class="online-label">Online</span>
            {/if}
          </div>
        {/each}
        {#if pendingMembers.length > 0}
          <div class="pending-divider">Pending</div>
          {#each pendingMembers as member (member.id)}
            <div class="member-row pending">
              <div class="member-avatar">
                {#if member.profilePictureUrl}
                  <UserAvatar profilePictureUrl={member.profilePictureUrl} width={28} height={28} />
                {:else}
                  <span class="avatar-initials">{member.displayName.slice(0, 2).toUpperCase()}</span
                  >
                {/if}
              </div>
              <span class="member-name">{member.displayName}</span>
              <span class="pending-label">Pending</span>
            </div>
          {/each}
        {/if}
      {/if}
    </div>
  {/if}
</div>

<AddGroupMemberModal open={addMemberOpen} {group} onClose={() => (addMemberOpen = false)} />

<ConfirmationModal
  open={leaveConfirmOpen}
  title="Leave {group.name}?"
  message="You will no longer receive messages from this group. You can be re-invited by a member."
  confirmLabel={leavePending ? 'Leaving…' : 'Leave group'}
  variant="delete"
  onConfirm={confirmLeave}
  onClose={() => (leaveConfirmOpen = false)}
/>

<style>
  .header-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .group-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #888;
  }

  .group-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .secret-badge {
    font-size: 10px;
    font-weight: 600;
    color: #ff6203;
    background: #fff0eb;
    border: 1px solid #ffd8c8;
    border-radius: 10px;
    padding: 1px 7px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .name {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    letter-spacing: -0.01em;
    line-height: 1.5;
  }

  .member-count-btn {
    display: flex;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
    letter-spacing: 0.01em;
    line-height: 1;
    transition: color 0.15s;
  }

  .member-count-btn:hover {
    color: #888;
  }

  .count-chevron {
    display: flex;
    align-items: center;
    transition: transform 0.15s ease;
    transform: rotate(-90deg);
  }

  .count-chevron.open {
    transform: rotate(0deg);
  }

  .action-group {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 4px;
  }

  .members-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 12px;
    background: #fff;
    border: 1.5px solid #ebebeb;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    min-width: 220px;
    max-width: 280px;
    z-index: 50;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .members-loading {
    display: flex;
    justify-content: center;
    padding: 12px;
  }

  .member-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 8px;
  }

  .member-avatar {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f0f0f0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .avatar-initials {
    font-size: 10px;
    font-weight: 600;
    color: #888;
  }

  .presence-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ccc;
    border: 1.5px solid #fff;
  }

  .presence-dot.online {
    background: #3ecf6e;
  }

  .member-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #2a2a2a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .online-label {
    font-size: 11px;
    color: #3ecf6e;
    font-weight: 500;
    flex-shrink: 0;
  }

  .pending-divider {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #bbb;
    padding: 6px 8px 2px;
  }

  .member-row.pending .member-name {
    color: #aaa;
  }

  .pending-label {
    font-size: 11px;
    color: #ff843c;
    font-weight: 500;
    flex-shrink: 0;
  }
</style>
