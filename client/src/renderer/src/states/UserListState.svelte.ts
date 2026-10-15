import type { Conversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface PendingInvite {
  conversation: Conversation
  fromUser: User
}

export interface SentInvite {
  conversation: Conversation
  toUser: User
}

class ConversationInviteService {
  pendingInvites = $state<PendingInvite[]>([])
  sentInvites = $state<SentInvite[]>([])

  addPendingInvite(invite: PendingInvite): void {
    const exists = this.pendingInvites.find((i) => i.conversation.id === invite.conversation.id)
    if (!exists) {
      this.pendingInvites = [...this.pendingInvites, invite]
    }
  }

  removePendingInvite(conversationId: number): void {
    this.pendingInvites = this.pendingInvites.filter((i) => i.conversation.id !== conversationId)
  }

  addSentInvite(invite: SentInvite): void {
    const exists = this.sentInvites.find((i) => i.conversation.id === invite.conversation.id)
    if (!exists) {
      this.sentInvites = [...this.sentInvites, invite]
    }
  }

  removeSentInvite(conversationId: number): void {
    this.sentInvites = this.sentInvites.filter((i) => i.conversation.id !== conversationId)
  }

  clear(): void {
    this.pendingInvites = []
    this.sentInvites = []
  }
}

export const conversationInviteService = new ConversationInviteService()
