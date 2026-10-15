import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Message, MessageReaction } from '$src/interfaces/Messages'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { incomingMessageService } from '$src/services/websocket/handlers/IncomingMessageService'
import { messageLoaderService } from '$src/services/MessageLoaderService'
import { reactionService } from '$src/services/ReactionService'
import { typingIndicatorService } from '$src/services/TypingIndicatorService'

export const messageHandlers = {
  [WebSocketMessageType.RECEIVE_MESSAGE]: incomingMessageService.handleIncomingMessage,

  [WebSocketMessageType.RECEIVE_EDIT_MESSAGE]: (data: WebSocketMessage<Message>) => {
    void incomingMessageService.handleEditedMessage(data)
  },

  [WebSocketMessageType.RECEIVE_DELETE_MESSAGE]: incomingMessageService.handleDeletedMessage,

  [WebSocketMessageType.RECEIVE_ADD_REACTION]: (data: WebSocketMessage<MessageReaction>) => {
    reactionService.handleIncomingReactionAdded(data.payload)
  },

  [WebSocketMessageType.RECEIVE_REMOVE_REACTION]: (data: WebSocketMessage<MessageReaction>) => {
    reactionService.handleIncomingReactionRemoved(data.payload)
  },

  [WebSocketMessageType.CONVERSATION_READ]: (
    data: WebSocketMessage<{ conversationId: number; readAt: string }>
  ) => {
    messageLoaderService.setConversationReadAt(data.payload.conversationId, data.payload.readAt)
  },

  [WebSocketMessageType.RECEIVE_TYPING_INDICATOR]: typingIndicatorService.handleIncoming
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
