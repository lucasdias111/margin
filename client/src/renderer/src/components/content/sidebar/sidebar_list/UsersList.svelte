<script lang="ts">
  import UserEntry from '$src/components/content/sidebar/sidebar_list/UserEntry.svelte'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { chatService } from '$src/services/ChatService'
  import { navigationState } from '$src/states/NavigationState.svelte'
  import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
  import { isDirectConversation } from '$src/interfaces/Conversation'
  import { usersState } from '$src/states/UsersState.svelte'
  import { conversationInviteService } from '$src/states/UserListState.svelte'

  let { searchUser = '' }: { searchUser?: string } = $props()

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
</script>

<div class="chat_overview">
  {#if conversationInviteService.pendingInvites.length > 0}
    <div class="section-label">Pending invites</div>
    <ul class="invite-list">
      {#each conversationInviteService.pendingInvites as invite (invite.conversation.id)}
        <li class="invite-entry">
          <UserAvatar profilePictureUrl={invite.fromUser.profilePictureUrl} height={30} />
          <span class="invite-name">{invite.fromUser.displayName ?? invite.fromUser.handle}</span>
          <div class="invite-actions">
            <button
              class="accept-btn"
              onclick={() => chatService.acceptConversationInvite(invite)}
            >
              Accept
            </button>
            <button
              class="decline-btn"
              onclick={() => chatService.declineConversationInvite(invite.conversation.id)}
            >
              Decline
            </button>
          </div>
        </li>
      {/each}
    </ul>
    <div class="section-divider"></div>
  {/if}

  {#if recentUsers.length > 0}
    <ul>
      {#each recentUsers as recentUser (recentUser.user.id)}
        <UserEntry
          isOnline={recentUser.user.isOnline}
          isSelected={navigationState.selectedUser?.id === recentUser.user.id}
          {recentUser}
        />
      {/each}
    </ul>
  {:else if conversationInviteService.pendingInvites.length === 0}
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
    min-height: 0;
    overflow-y: auto;
    width: 100%;
  }

  .chat_overview ul {
    display: flex;
    flex-direction: column;
    padding: 0 10px 20px;
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

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #aaa;
    padding: 8px 18px 4px;
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

  .invite-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 10px;
    background: #fff8f5;
  }

  .invite-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #2d2d2d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .invite-actions {
    display: flex;
    gap: 4px;
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
