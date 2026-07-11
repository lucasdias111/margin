import { describe, expect, it, vi } from 'vitest'
import { channelCallService } from '../call/ChannelCallService'
import { webSocketService } from '$src/services/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'

vi.mock('$src/services/WebSocketService', () => ({
  webSocketService: {
    send: vi.fn()
  }
}))

describe('ChannelCallService.inviteToChannelCall', () => {
  it('sends a CHANNEL_CALL_INVITE frame to the recipient with the channel id', () => {
    channelCallService.inviteToChannelCall(42, 7)

    expect(webSocketService.send).toHaveBeenCalledWith({
      type: WebSocketMessageType.CHANNEL_CALL_INVITE,
      recipientId: 42,
      payload: '7'
    })
  })
})
