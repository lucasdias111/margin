import type { GroupConversation } from '$src/interfaces/Conversation'
import { authenticatedDelete, authenticatedPost } from '$src/services/api'
import { channelService } from '$src/services/ChannelService'
import { navigationService } from '$src/services/NavigationService'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { navigationState } from '$src/states/NavigationState.svelte'
import { View } from '$src/interfaces/View'
import { messageLoaderService } from './MessageLoaderService'

class GroupConversationService {
  async createGroupConversation(
    memberEmails: string[],
    name: string,
    encrypted = false
  ): Promise<GroupConversation> {
    const response = await authenticatedPost(
      { memberEmails, name, encrypted },
      'conversations/group'
    )
    if (!response.ok) throw new Error('Failed to create group conversation')
    const group: GroupConversation = await response.json()
    conversationsState.byId.set(group.id, group)
    if (!conversationsState.conversationMetaById.has(group.id)) {
      conversationsState.conversationMetaById.set(group.id, defaultMeta())
    }
    return group
  }

  selectGroupConversation(group: GroupConversation): void {
    navigationState.selectedUser = null
    navigationState.selectedGroupConversation = group
    navigationService.setView(View.Private)
    channelService.select(null)
    messageLoaderService.loadConversationForGroup(group)
  }

  async addGroupMember(conversationId: number, userId: number): Promise<void> {
    const response = await authenticatedPost({ userId }, `conversations/${conversationId}/members`)
    if (!response.ok) throw new Error('Failed to add member')
    const conv = conversationsState.byId.get(conversationId)
    if (conv && conv.type === 'GROUP') {
      conversationsState.byId.set(conversationId, {
        ...conv,
        memberIds: [...conv.memberIds, userId]
      })
    }
  }

  async leaveGroup(conversationId: number): Promise<void> {
    const userId = sessionState.currentUser?.id
    if (!userId) return
    const response = await authenticatedDelete(
      null,
      `conversations/${conversationId}/members/${userId}`
    )
    if (!response.ok) throw new Error('Failed to leave group')
    conversationsState.byId.delete(conversationId)
    conversationsState.messagesByConversationId.delete(conversationId)
    conversationsState.conversationMetaById.delete(conversationId)
    navigationState.selectedGroupConversation = null
  }
}

export const groupConversationService = new GroupConversationService()
