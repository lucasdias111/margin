<script lang="ts">
  import type { Conversation } from '$src/interfaces/Conversation'
  import type { User } from '$src/interfaces/User'
  import type { ConversationMeta } from '$src/states/ConversationsState.svelte.js'
  import UserAvatar from '$src/components/common/user/UserAvatar.svelte'
  import { formatConversationTimestamp } from '$src/utils/DateUtils'
  import { usersService } from '$src/services/UsersService'
  import { notificationService } from '$src/services/NotificationService'
  import SidebarConversationEntry from './SidebarConversationEntry.svelte'

  interface RecentUserEntry {
    conversation: Conversation
    user: User
    meta: ConversationMeta
  }

  interface Props {
    recentUser: RecentUserEntry
    isSelected: boolean
    isOnline: boolean
  }

  let { recentUser, isSelected = false, isOnline }: Props = $props()
  const chatUser = $derived(recentUser.user)
  const meta = $derived(recentUser.meta)
  const unreadCount = $derived(notificationService.isUnread(recentUser.conversation.id) ? 1 : 0)
  const lastMessageTime = $derived(
    meta.lastMessageTime ? formatConversationTimestamp(meta.lastMessageTime) : null
  )
  const isSecret = $derived(
    recentUser.conversation.type !== 'CHANNEL' && recentUser.conversation.encrypted
  )

  function lastMessagePreview(msg: string | null): string | null {
    if (!msg) return msg
    if (/\.gif(\?|$)/i.test(msg) || /static\.klipy\.com/i.test(msg)) return 'GIF'
    return msg
  }
</script>

<SidebarConversationEntry
  name={chatUser.displayName}
  lastMessage={lastMessagePreview(meta.lastMessage)}
  {lastMessageTime}
  {unreadCount}
  {isSelected}
  {isSecret}
  onclick={() => usersService.select(chatUser)}
>
  {#snippet avatar()}
    {#if chatUser.profilePictureUrl}
      <UserAvatar profilePictureUrl={chatUser.profilePictureUrl} width={38} height={38} />
    {:else}
      <span class="avatar-initials">{chatUser.displayName.slice(0, 2).toUpperCase()}</span>
    {/if}
    <span class="presence-dot" class:online={isOnline}></span>
  {/snippet}
</SidebarConversationEntry>

<style>
  .avatar-initials {
    font-size: 0.8rem;
    font-weight: 600;
    color: #888;
  }

  .presence-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ddd;
    border: 2px solid white;
  }

  .presence-dot.online {
    background: #3dd68c;
  }
</style>
