import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { inviteService } from '$src/services/ConversationInviteService'

export const inviteHandlers = {
  [WebSocketMessageType.CONVERSATION_INVITE]: inviteService.handleIncomingConversationInvite,
  [WebSocketMessageType.CONVERSATION_INVITE_ACCEPTED]:
    inviteService.handleConversationInviteAccepted,
  [WebSocketMessageType.CONVERSATION_INVITE_DECLINED]:
    inviteService.handleConversationInviteDeclined
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
