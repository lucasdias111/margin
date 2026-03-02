import type { Message } from '$src/interfaces/Messages'
import type { Conversation } from '$src/interfaces/Conversation'

class ConversationState {
  messages = $state<Message[]>([])
  currentConversation = $state<Conversation | null>(null)
  isLoading: boolean = $state<boolean>(false)

  clear(): void {
    this.messages = []
    this.currentConversation = null
    this.isLoading = false
  }
}

export const conversationState = new ConversationState()
