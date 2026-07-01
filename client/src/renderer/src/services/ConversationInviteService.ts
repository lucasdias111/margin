import type { DirectConversation, GroupConversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import {
  conversationInviteService as inviteState,
  type PendingInvite,
  type SentInvite
} from '$src/states/UserListState.svelte'
import { usersState } from '$src/states/UsersState.svelte'

class ConversationInviteService {
  handleIncomingConversationInvite = (data: WebSocketMessage<PendingInvite>): void => {
    inviteState.addPendingInvite(data.payload)
  }

  handleConversationInviteAccepted = (
    data: WebSocketMessage<{ conversation: DirectConversation; acceptedBy: User }>
  ): void => {
    const { conversation, acceptedBy } = data.payload

    usersState.add(acceptedBy)

    const accepted: DirectConversation = {
      ...conversation,
      otherUserId: acceptedBy.id,
      inviteStatus: 'ACCEPTED'
    }
    conversationsState.byId.set(accepted.id, accepted)

    if (!conversationsState.conversationMetaById.has(accepted.id)) {
      conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
    }

    inviteState.removeSentInvite(accepted.id)
  }

  handleConversationInviteDeclined = (
    data: WebSocketMessage<{ conversationId: number; declinedBy: User }>
  ): void => {
    inviteState.removeSentInvite(data.payload.conversationId)
  }

  async sendConversationInvite(email: string, encrypted = false, recipient?: User): Promise<void> {
    const response = await authenticatedPost({ email, encrypted }, 'conversations/invite')

    if (recipient) {
      const conversation: DirectConversation = await response.json()
      inviteState.addSentInvite({ conversation, toUser: recipient })
    }
  }

  async acceptConversationInvite(invite: PendingInvite): Promise<void> {
    await authenticatedPost(null, `conversations/${invite.conversation.id}/invite/accept`)
    inviteState.removePendingInvite(invite.conversation.id)

    if (invite.conversation.type === 'DIRECT') {
      usersState.add(invite.fromUser)
      const accepted: DirectConversation = {
        ...invite.conversation,
        otherUserId: invite.fromUser.id,
        inviteStatus: 'ACCEPTED'
      }
      conversationsState.byId.set(accepted.id, accepted)
      if (!conversationsState.conversationMetaById.has(accepted.id)) {
        conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
      }
    } else if (invite.conversation.type === 'GROUP') {
      const group = invite.conversation as GroupConversation
      conversationsState.byId.set(group.id, group)
      if (!conversationsState.conversationMetaById.has(group.id)) {
        conversationsState.conversationMetaById.set(group.id, defaultMeta())
      }
    }
  }

  async declineConversationInvite(conversationId: number): Promise<void> {
    await authenticatedPost(null, `conversations/${conversationId}/invite/decline`)
    inviteState.removePendingInvite(conversationId)
  }

  async loadPendingInvites(): Promise<void> {
    try {
      const response = await authenticatedGet('conversations/pending_invites')
      if (!response.ok) return
      const invites: PendingInvite[] = await response.json()
      invites.forEach((invite) => inviteState.addPendingInvite(invite))
    } catch (error) {
      console.error('Failed to load pending invites:', error)
    }
  }

  async loadSentInvites(): Promise<void> {
    try {
      const response = await authenticatedGet('conversations/sent_invites')
      if (!response.ok) return
      const invites: SentInvite[] = await response.json()
      invites.forEach((invite) => inviteState.addSentInvite(invite))
    } catch (error) {
      console.error('Failed to load sent invites:', error)
    }
  }
}

export const inviteService = new ConversationInviteService()
