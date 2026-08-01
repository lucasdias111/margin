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

  // The server pushes this when someone is invited to a margin, but the invite
  // list is REST-driven and only refreshed on load/resync. Explicitly dropped
  // here so the registry stays exhaustive and the gap stays visible.
  [WebSocketMessageType.MARGIN_INVITE]: () => {}
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
