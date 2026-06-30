import type { Conversation } from '$src/interfaces/Conversation'
import type { User } from '$src/interfaces/User'

export interface PendingInvite {
  conversation: Conversation
  fromUser: User
}

class ConversationInviteService {
  pendingInvites = $state<PendingInvite[]>([])

  addPendingInvite(invite: PendingInvite): void {
    const exists = this.pendingInvites.find((i) => i.conversation.id === invite.conversation.id)
    if (!exists) {
      this.pendingInvites = [...this.pendingInvites, invite]
    }
  }

  removePendingInvite(conversationId: number): void {
    this.pendingInvites = this.pendingInvites.filter((i) => i.conversation.id !== conversationId)
  }

  clear(): void {
    this.pendingInvites = []
  }
}

export const conversationInviteService = new ConversationInviteService()
