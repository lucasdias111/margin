import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { User } from '$src/interfaces/User'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { spaceService } from '$src/services/SpaceService'

export const marginHandlers = {
  [WebSocketMessageType.USER_JOINED_SPACE]: (
    data: WebSocketMessage<{ spaceId: number; user: User }>
  ) => {
    spaceService.addMemberToSpace(data.payload.spaceId, data.payload.user)
  },

  [WebSocketMessageType.MARGIN_INVITE]: () => {}
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
