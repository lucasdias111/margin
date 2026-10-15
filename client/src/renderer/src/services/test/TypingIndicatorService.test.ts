import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { typingIndicatorService } from '../TypingIndicatorService'
import { webSocketService } from '$src/services/websocket/WebSocketService'
import { typingIndicatorState } from '$src/states/TypingIndicatorState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type {
  TypingIndicatorEventPayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'

vi.mock('$src/services/websocket/WebSocketService', () => ({
  webSocketService: {
    send: vi.fn()
  }
}))

function typingMessage(
  conversationId: number,
  payload: TypingIndicatorEventPayload
): WebSocketMessage<TypingIndicatorEventPayload> {
  return {
    type: WebSocketMessageType.RECEIVE_TYPING_INDICATOR,
    timestamp: Date.now(),
    recipientId: conversationId,
    payload
  }
}

describe('TypingIndicatorService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    typingIndicatorState.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    typingIndicatorState.clear()
  })

  describe('notifyTyping', () => {
    it('sends isTyping:true with the conversation id on first call', () => {
      typingIndicatorService.notifyTyping(101)

      expect(webSocketService.send).toHaveBeenCalledTimes(1)
      expect(webSocketService.send).toHaveBeenCalledWith({
        type: WebSocketMessageType.SEND_TYPING_INDICATOR,
        recipientId: 101,
        payload: { isTyping: true }
      })
    })

    it('does not resend within the throttle window', () => {
      typingIndicatorService.notifyTyping(102)
      vi.advanceTimersByTime(1000)
      typingIndicatorService.notifyTyping(102)
      vi.advanceTimersByTime(1000)
      typingIndicatorService.notifyTyping(102)

      expect(webSocketService.send).toHaveBeenCalledTimes(1)
    })

    it('resends after the throttle window elapses', () => {
      typingIndicatorService.notifyTyping(103)
      vi.advanceTimersByTime(3000)
      typingIndicatorService.notifyTyping(103)

      expect(webSocketService.send).toHaveBeenCalledTimes(2)
      expect(webSocketService.send).toHaveBeenLastCalledWith({
        type: WebSocketMessageType.SEND_TYPING_INDICATOR,
        recipientId: 103,
        payload: { isTyping: true }
      })
    })

    it('auto-stops after inactivity even without an explicit stopTyping call', () => {
      typingIndicatorService.notifyTyping(104)
      vi.advanceTimersByTime(4000)

      expect(webSocketService.send).toHaveBeenLastCalledWith({
        type: WebSocketMessageType.SEND_TYPING_INDICATOR,
        recipientId: 104,
        payload: { isTyping: false }
      })
    })
  })

  describe('stopTyping', () => {
    it('sends isTyping:false after typing was active', () => {
      typingIndicatorService.notifyTyping(105)
      typingIndicatorService.stopTyping(105)

      expect(webSocketService.send).toHaveBeenLastCalledWith({
        type: WebSocketMessageType.SEND_TYPING_INDICATOR,
        recipientId: 105,
        payload: { isTyping: false }
      })
    })

    it('is a no-op when nothing was in flight', () => {
      typingIndicatorService.stopTyping(106)

      expect(webSocketService.send).not.toHaveBeenCalled()
    })
  })

  describe('handleIncoming', () => {
    it('adds the user to state when isTyping is true', () => {
      typingIndicatorService.handleIncoming(
        typingMessage(10, { userId: 2, displayName: 'Bob', isTyping: true })
      )

      expect(typingIndicatorState.byConversationId.get(10)).toEqual([
        { userId: 2, displayName: 'Bob' }
      ])
    })

    it('removes the user from state when isTyping is false', () => {
      typingIndicatorService.handleIncoming(
        typingMessage(10, { userId: 2, displayName: 'Bob', isTyping: true })
      )
      typingIndicatorService.handleIncoming(
        typingMessage(10, { userId: 2, displayName: 'Bob', isTyping: false })
      )

      expect(typingIndicatorState.byConversationId.get(10)).toEqual([])
    })

    it('expires the typing user if no follow-up event arrives', () => {
      typingIndicatorService.handleIncoming(
        typingMessage(10, { userId: 2, displayName: 'Bob', isTyping: true })
      )

      vi.advanceTimersByTime(6000)

      expect(typingIndicatorState.byConversationId.get(10)).toEqual([])
    })
  })
})
