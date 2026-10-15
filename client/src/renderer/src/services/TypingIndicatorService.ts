import { webSocketService } from '$src/services/websocket/WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type {
  TypingIndicatorEventPayload,
  WebSocketMessage
} from '$src/interfaces/WebSocketMessages'
import { typingIndicatorState } from '$src/states/TypingIndicatorState.svelte'

const TYPING_RESEND_INTERVAL_MS = 3000
const TYPING_STOP_DELAY_MS = 4000
const TYPING_EXPIRY_MS = 6000

class TypingIndicatorService {
  private lastSentAtByConversation = new Map<number, number>()
  private stopTimers = new Map<number, ReturnType<typeof setTimeout>>()
  private expiryTimers = new Map<string, ReturnType<typeof setTimeout>>()

  notifyTyping(conversationId: number): void {
    const now = Date.now()
    const lastSent = this.lastSentAtByConversation.get(conversationId) ?? 0
    if (now - lastSent >= TYPING_RESEND_INTERVAL_MS) {
      this.lastSentAtByConversation.set(conversationId, now)
      this.send(conversationId, true)
    }
    this.rescheduleStop(conversationId)
  }

  stopTyping(conversationId: number): void {
    this.clearStopTimer(conversationId)
    if (!this.lastSentAtByConversation.has(conversationId)) return
    this.lastSentAtByConversation.delete(conversationId)
    this.send(conversationId, false)
  }

  handleIncoming = (msg: WebSocketMessage<TypingIndicatorEventPayload>): void => {
    const conversationId = msg.recipientId
    const payload = msg.payload
    if (!conversationId || !payload) return

    const key = `${conversationId}:${payload.userId}`
    const existingExpiry = this.expiryTimers.get(key)
    if (existingExpiry) {
      clearTimeout(existingExpiry)
      this.expiryTimers.delete(key)
    }

    if (payload.isTyping) {
      typingIndicatorState.setTyping(conversationId, {
        userId: payload.userId,
        displayName: payload.displayName
      })
      this.expiryTimers.set(
        key,
        setTimeout(() => {
          typingIndicatorState.clearTyping(conversationId, payload.userId)
          this.expiryTimers.delete(key)
        }, TYPING_EXPIRY_MS)
      )
    } else {
      typingIndicatorState.clearTyping(conversationId, payload.userId)
    }
  }

  private rescheduleStop(conversationId: number): void {
    this.clearStopTimer(conversationId)
    const timer = setTimeout(() => this.stopTyping(conversationId), TYPING_STOP_DELAY_MS)
    this.stopTimers.set(conversationId, timer)
  }

  private clearStopTimer(conversationId: number): void {
    const timer = this.stopTimers.get(conversationId)
    if (timer) {
      clearTimeout(timer)
      this.stopTimers.delete(conversationId)
    }
  }

  private send(conversationId: number, isTyping: boolean): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_TYPING_INDICATOR,
      recipientId: conversationId,
      payload: { isTyping }
    })
  }
}

export const typingIndicatorService = new TypingIndicatorService()
