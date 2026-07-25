<script lang="ts">
  import type { GroupConversation } from '$src/interfaces/Conversation'
  import type { ConversationMeta } from '$src/states/ConversationsState.svelte'
  import Icon from '$src/components/common/icons/Icon.svelte'
  import { defaultMeta } from '$src/states/ConversationsState.svelte'
  import { notificationService } from '$src/services/NotificationService'
  import { formatConversationTimestamp } from '$src/utils/DateUtils'
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
    displayMeta.lastMessageTime ? formatConversationTimestamp(displayMeta.lastMessageTime) : null
  )
</script>

<li>
  <SidebarConversationEntry
    name={group.name}
    lastMessage={displayMeta.lastMessage}
    {lastMessageTime}
    {unreadCount}
    {isSelected}
    isSecret={group.encrypted}
    {onclick}
    class="group-entry"
  >
    {#snippet avatar()}
      <Icon name="users" size={14} />
    {/snippet}
  </SidebarConversationEntry>
</li>

<style>
  li {
    list-style: none;
  }
</style>
