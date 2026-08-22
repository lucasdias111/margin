<script lang="ts">
  import { flip } from 'svelte/animate'
  import { slide as slideCollapse } from 'svelte/transition'
  import { DURATION, EASING, listItemIn, listItemOut } from '$src/animations'

  import UserEntry from '$src/components/content/sidebar/sidebar_list/UserEntry.svelte'
  import GroupEntry from '$src/components/content/sidebar/sidebar_list/GroupEntry.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { inviteService } from '$src/services/ConversationInviteService'
  import { groupConversationService } from '$src/services/GroupConversationService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { isDirectConversation, isGroupConversation } from '$src/interfaces/Conversation'
  import { usersState } from '$src/states/UsersState.svelte'
  import { conversationInviteService } from '$src/states/UserListState.svelte'

  let { searchUser = '' }: { searchUser?: string } = $props()

  let groupsOpen = $state(true)
  let dmsOpen = $state(true)
  let sentInvitesOpen = $state(true)

  const recentUsers = $derived(
    [...conversationsState.byId.values()]
      .filter(isDirectConversation)
      .map((conv) => {
        const user = usersState.byId.get(conv.otherUserId)
        if (!user) return null
        const meta = conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()
        return { conversation: conv, user, meta }
      })
      .filter((x) => x !== null)
      .sort((a, b) => {
        if (!a!.meta.lastMessageTime) return 1
        if (!b!.meta.lastMessageTime) return -1
        return (
          new Date(b!.meta.lastMessageTime).getTime() - new Date(a!.meta.lastMessageTime).getTime()
        )
      })
  )

  const recentGroups = $derived(
    [...conversationsState.byId.values()]
      .filter(isGroupConversation)
      .map((group) => {
        const meta = conversationsState.conversationMetaById.get(group.id) ?? defaultMeta()
        return { group, meta }
      })
      .sort((a, b) => {
        if (!a.meta.lastMessageTime) return 1
        if (!b.meta.lastMessageTime) return -1
        return (
          new Date(b.meta.lastMessageTime).getTime() - new Date(a.meta.lastMessageTime).getTime()
        )
      })
  )

  const hasAnyContent = $derived(
    recentUsers.length > 0 ||
      recentGroups.length > 0 ||
      conversationInviteService.pendingInvites.length > 0 ||
      conversationInviteService.sentInvites.length > 0
  )
  const sectionSlide = { duration: DURATION.base, easing: EASING.standard }
</script>

<div class="chat_overview">
  {#if conversationInviteService.sentInvites.length > 0}
    <button class="section-header" onclick={() => (sentInvitesOpen = !sentInvitesOpen)}>
      <span class="section-label">Sent invites</span>
      <span class="chevron" class:open={sentInvitesOpen}>
        <Icon name="chevronDown" size={12} />
      </span>
    </button>
    {#if sentInvitesOpen}
      <ul class="invite-list" transition:slideCollapse={sectionSlide}>
        {#each conversationInviteService.sentInvites as invite (invite.conversation.id)}
          <li
            class="invite-item"
            animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
            in:listItemIn
            out:listItemOut
          >
            <UserAvatar profilePictureUrl={invite.toUser.profilePictureUrl} height={30} />

            <div class="invite-info">
              <div class="invite-name-row">
                <span class="invite-name">{invite.toUser.displayName}</span>
                {#if invite.conversation.type !== 'CHANNEL' && invite.conversation.encrypted}
                  <span class="secret-label">Secret</span>
                {/if}
              </div>
              <span class="invite-from">Waiting for response</span>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
    <div class="section-divider"></div>
  {/if}

  {#if conversationInviteService.pendingInvites.length > 0}
    <div class="section-header-static">
      <span class="section-label">Pending invites</span>
    </div>
    <ul class="invite-list">
      {#each conversationInviteService.pendingInvites as invite (invite.conversation.id)}
        <li
          class="invite-item"
          animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
          in:listItemIn
          out:listItemOut
        >
          {#if invite.conversation.type === 'GROUP'}
            <div class="group-invite-avatar">
              <Icon name="users" size={13} />
            </div>
          {:else}
            <UserAvatar profilePictureUrl={invite.fromUser.profilePictureUrl} height={30} />
          {/if}

          <div class="invite-info">
            <div class="invite-name-row">
              <span class="invite-name">
                {#if invite.conversation.type === 'GROUP'}
                  {invite.conversation.name}
                {:else}
                  {invite.fromUser.displayName}
                {/if}
              </span>
              {#if invite.conversation.type !== 'CHANNEL' && invite.conversation.encrypted}
                <span class="secret-label">Secret</span>
              {/if}
            </div>
            <span class="invite-from">
              {#if invite.conversation.type === 'GROUP'}
                Group from {invite.fromUser.displayName}
              {:else}
                Private chat
              {/if}
            </span>
          </div>

          <div class="invite-actions">
            <button
              class="accept-btn"
              onclick={() => inviteService.acceptConversationInvite(invite)}
            >
              Accept
            </button>
            <button
              class="decline-btn"
              onclick={() => inviteService.declineConversationInvite(invite.conversation.id)}
            >
              Decline
            </button>
          </div>
        </li>
      {/each}
    </ul>
    <div class="section-divider"></div>
  {/if}

  {#if recentGroups.length > 0}
    <button class="section-header" onclick={() => (groupsOpen = !groupsOpen)}>
      <span class="section-label">Groups</span>
      <span class="chevron" class:open={groupsOpen}>
        <Icon name="chevronDown" size={12} />
      </span>
    </button>
    {#if groupsOpen}
      <ul transition:slideCollapse={sectionSlide}>
        {#each recentGroups as { group, meta } (group.id)}
          <li
            class="entry-row"
            animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
            in:listItemIn
            out:listItemOut
          >
            <GroupEntry
              {group}
              {meta}
              isSelected={navigationState.selectedGroupConversation?.id === group.id}
              onclick={() => groupConversationService.selectGroupConversation(group)}
            />
          </li>
        {/each}
      </ul>
    {/if}
    {#if recentUsers.length > 0}
      <div class="section-divider"></div>
    {/if}
  {/if}

  {#if recentUsers.length > 0}
    <button class="section-header" onclick={() => (dmsOpen = !dmsOpen)}>
      <span class="section-label">Direct messages</span>
      <span class="chevron" class:open={dmsOpen}>
        <Icon name="chevronDown" size={12} />
      </span>
    </button>
    {#if dmsOpen}
      <ul transition:slideCollapse={sectionSlide}>
        {#each recentUsers as recentUser (recentUser.user.id)}
          <li
            class="entry-row"
            animate:flip={{ duration: DURATION.base, easing: EASING.standard }}
            in:listItemIn
            out:listItemOut
          >
            <UserEntry
              isOnline={recentUser.user.isOnline}
              isSelected={navigationState.selectedUser?.id === recentUser.user.id}
              {recentUser}
            />
          </li>
        {/each}
      </ul>
    {/if}
  {:else if !hasAnyContent}
    <div class="empty-state">
      <Icon name="users" />
      <p class="empty-state-text">
        {searchUser ? 'No users match your search' : 'No recent conversations yet'}
      </p>
    </div>
  {/if}
</div>

<style>
  .chat_overview {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    width: 100%;
  }

  /* Wrapper that lets a conversation row be reordered with animate:flip. */
  .entry-row {
    display: flex;
    width: 100%;
    min-width: 0;
  }

  .chat_overview ul {
    display: flex;
    flex-direction: column;
    padding: 0 10px 8px;
    margin: 0;
    list-style: none;
    gap: 2px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 48px;
    gap: 12px;
  }

  .empty-state-text {
    color: #888;
    font-size: 13px;
    font-family: inherit;
    margin: 0;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    padding: 8px 18px 4px;
    cursor: pointer;
    font-family: inherit;
  }

  .section-header:hover .section-label {
    color: #888;
  }

  .section-header:hover .chevron {
    color: #999;
  }

  .section-label {
    transition: color var(--motion-fast) var(--ease-standard);
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
  }

  .chevron {
    color: #ccc;
    display: flex;
    align-items: center;
    transition: transform var(--motion-base) var(--ease-spring);
    transform: rotate(-90deg);
  }

  .chevron.open {
    transform: rotate(0deg);
  }

  .section-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.06);
    margin: 6px 14px;
  }

  .invite-list {
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    margin: 0;
    list-style: none;
    gap: 4px;
  }

  .invite-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 10px;
    background: #fff8f5;
  }

  .group-invite-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    flex-shrink: 0;
  }

  .invite-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .invite-name-row {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }

  .invite-name {
    font-size: 13px;
    font-weight: 500;
    color: #2d2d2d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .secret-label {
    font-size: 10px;
    font-weight: 600;
    color: #ff6203;
    background: #fff0eb;
    border: 1px solid #ffd8c8;
    border-radius: 10px;
    padding: 1px 6px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .invite-from {
    font-size: 11px;
    color: #aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .section-header-static {
    padding: 8px 18px 4px;
  }

  .invite-actions {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex-shrink: 0;
  }

  .accept-btn {
    background: #ff6203;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .decline-btn {
    background: none;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 11px;
    cursor: pointer;
    color: #888;
    font-family: inherit;
  }

  .decline-btn:hover {
    border-color: #bbb;
    color: #555;
  }
</style>
