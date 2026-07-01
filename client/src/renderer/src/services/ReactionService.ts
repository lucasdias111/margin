import type { Message, MessageReaction } from '$src/interfaces/Messages'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { conversationsState } from '$src/states/ConversationsState.svelte.js'

class ReactionService {
  addReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_ADD_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  removeReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_REMOVE_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  handleIncomingReactionAdded = (reaction: MessageReaction): void => {
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }

    const already = updatedMessage.reactions.some(
      (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
    )

    if (!already) {
      updatedMessage.reactions = [...updatedMessage.reactions, reaction]
      const updatedMessages = [...messages]
      updatedMessages[index] = updatedMessage
      conversationsState.messagesByConversationId.set(convId, updatedMessages)
    }
  }

  handleIncomingReactionRemoved = (reaction: MessageReaction): void => {
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }
    updatedMessage.reactions = updatedMessage.reactions.filter(
      (r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
    )

    const updatedMessages = [...messages]
    updatedMessages[index] = updatedMessage
    conversationsState.messagesByConversationId.set(convId, updatedMessages)
  }
}

export const reactionService = new ReactionService()
