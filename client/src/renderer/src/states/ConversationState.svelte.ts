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
  deleteMessage(id: number): void {
    console.log('message deleted', id)
    this.messages = this.messages.filter((message) => message.id !== id)
  }
  editMessage(id: number, newContent: string): void {
    this.messages = this.messages.map((message) => {
      if (message.id === id) return { ...message, content: newContent }

      return message
    })
  }
}

export const conversationState = new ConversationState()
