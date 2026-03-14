import type { Message } from '$src/interfaces/Messages'
import type { Conversation } from '$src/interfaces/Conversation'

class ConversationState {
  messages = $state<Message[]>([])
  currentConversation = $state<Conversation | null>(null)
  isLoading: boolean = $state<boolean>(false)
  hasMore = $state<boolean>(true)
  isLoadingMore = $state<boolean>(false)

  selectConversation = (conversation: Conversation): void => {
    conversationState.currentConversation = conversation
  }

  clear(): void {
    this.messages = []
    this.currentConversation = null
    this.isLoading = false
  }
  deleteMessage(id: number): void {
    this.messages = this.messages.filter((message) => message.id !== id)
  }
}

export const conversationState = new ConversationState()
