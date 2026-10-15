import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { User } from '$src/interfaces/User'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { presenceService } from '$src/services/PrecenseService'

export const presenceHandlers = {
  [WebSocketMessageType.USER_LOGIN]: (data: WebSocketMessage<User>) => {
    presenceService.setOnline(data.payload.id)
  },

  [WebSocketMessageType.USER_LOGOUT]: (data: WebSocketMessage<User>) => {
    presenceService.setOffline(data.payload.id)
  }
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
