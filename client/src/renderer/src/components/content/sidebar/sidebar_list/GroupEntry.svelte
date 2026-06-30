<script lang="ts">
  import type { GroupConversation } from '$src/interfaces/Conversation'
  import type { ConversationMeta } from '$src/states/ConversationsState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { defaultMeta } from '$src/states/ConversationsState.svelte'
  import { notificationService } from '$src/services/NotificationService'
  import { formatTime } from '$src/utils/DateUtils'
  import SidebarConversationEntry from './SidebarConversationEntry.svelte'

  interface Props {
    group: GroupConversation
    meta: ConversationMeta
    isSelected: boolean
    onclick: () => void
  }

  let { group, meta, isSelected, onclick }: Props = $props()

  const displayMeta = $derived(meta ?? defaultMeta())
  const unreadCount = $derived(notificationService.isUnread(group.id) ? 1 : 0)
  const lastMessageTime = $derived(
    displayMeta.lastMessageTime ? formatTime(displayMeta.lastMessageTime) : null
  )
</script>

<li>
  <SidebarConversationEntry
    name={group.name}
    lastMessage={displayMeta.lastMessage}
    {lastMessageTime}
    {unreadCount}
    {isSelected}
    {onclick}
    class="group-entry"
  >
    {#snippet avatar()}
      <Icon name="users" size={14} />
    {/snippet}
    {#snippet badge()}
      {#if group.encrypted}
        <span class="secret-label">Secret</span>
      {/if}
    {/snippet}
  </SidebarConversationEntry>
</li>

<style>
  li {
    list-style: none;
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
</style>
