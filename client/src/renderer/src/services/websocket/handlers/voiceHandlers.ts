import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type {
  ChannelVoiceParticipantPayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'
import type { MessageHandler } from '$src/services/websocket/WebSocketService'
import { channelService } from '$src/services/ChannelService'

export const voiceHandlers = {
  [WebSocketMessageType.USER_JOINED_VOICE]: (
    data: WebSocketMessage<ChannelVoiceParticipantPayload>
  ) => {
    channelService.updateVoiceParticipant(data.payload.channelId, data.payload.user, true)
  },

  [WebSocketMessageType.USER_LEFT_VOICE]: (
    data: WebSocketMessage<ChannelVoiceParticipantPayload>
  ) => {
    channelService.updateVoiceParticipant(data.payload.channelId, data.payload.user, false)
  }
} satisfies Partial<Record<WebSocketMessageType, MessageHandler>>
