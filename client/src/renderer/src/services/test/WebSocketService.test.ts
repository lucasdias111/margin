import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  webSocketService,
  type LifecycleEvent,
  type WebSocketSessionAdapter
} from '$src/services/websocket/WebSocketService'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'

vi.mock('$src/states/ConnectionState.svelte', () => ({
  connectionState: {
    connectionStatus: 'disconnected'
  }
}))

vi.mock('$src/services/ErrorService', () => ({
  errorService: {
    reportError: vi.fn()
  }
}))

vi.mock('$src/shared/config', () => ({
  API_CONFIG: {
    wsUrl: 'ws://localhost:8080/ws'
  }
}))

interface MockWebSocket {
  readyState: number
  send: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  onopen: ((ev: Event) => void) | null
  onmessage: ((ev: MessageEvent) => void) | null
  onerror: ((ev: Event) => void) | null
  onclose: ((ev: CloseEvent) => void) | null
}

let lastCreatedWs: MockWebSocket | null = null
let session: WebSocketSessionAdapter & {
  getToken: ReturnType<typeof vi.fn>
  restoreSession: ReturnType<typeof vi.fn>
  onSessionInvalid: ReturnType<typeof vi.fn>
}

function installSessionStub(): void {
  session = {
    getToken: vi.fn().mockReturnValue(null),
    restoreSession: vi.fn().mockResolvedValue(false),
    onSessionInvalid: vi.fn()
  }
  webSocketService.configureSession(session)
}

function installWebSocketMock(): void {
  globalThis.WebSocket = vi.fn(function () {
    lastCreatedWs = {
      readyState: WebSocket.CONNECTING,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    }
    return lastCreatedWs
  }) as unknown as typeof WebSocket
  Object.assign(globalThis.WebSocket, {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  })
}

function getInternalWs(): MockWebSocket | null {
  return (webSocketService as unknown as { ws: MockWebSocket | null }).ws
}

function setInternalWs(ws: MockWebSocket | null): void {
  ;(webSocketService as unknown as { ws: MockWebSocket | null }).ws = ws
}

function resetInternalState(): void {
  setInternalWs(null)
  const service = webSocketService as unknown as {
    handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
    lifecycleListeners: Map<LifecycleEvent, (() => void)[]>
    reconnectAttempts: number
    intentionalDisconnect: boolean
    isRestoringSession: boolean
  }
  service.handlers.clear()
  service.lifecycleListeners.clear()
  service.reconnectAttempts = 0
  service.intentionalDisconnect = false
  service.isRestoringSession = false
}

function createFakeToken(expiresInMs: number = 3600_000): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ exp: Math.floor((Date.now() + expiresInMs) / 1000) }))
  return `${header}.${payload}.fake-signature`
}

function connectWithToken(): MockWebSocket {
  session.getToken.mockReturnValue(createFakeToken())
  webSocketService.connect()
  lastCreatedWs!.readyState = WebSocket.OPEN
  lastCreatedWs!.onopen?.({} as Event)
  return lastCreatedWs!
}

describe('WebSocketService', () => {
  beforeEach(() => {
    installWebSocketMock()
    installSessionStub()
    resetInternalState()
    connectionState.connectionStatus = 'disconnected'
    lastCreatedWs = null
  })

  afterEach(() => {
    webSocketService.disconnect()
  })

  describe('on / off', () => {
    it('registers a handler for a message type', () => {
      const handler = vi.fn()

      webSocketService.on('TEST_TYPE', handler)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.get('TEST_TYPE')).toContain(handler)
    })

    it('does not register the same handler twice', () => {
      const handler = vi.fn()

      webSocketService.on('TEST_TYPE', handler)
      webSocketService.on('TEST_TYPE', handler)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.get('TEST_TYPE')).toHaveLength(1)
    })

    it('registers multiple different handlers for the same type', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      webSocketService.on('TEST_TYPE', handler1)
      webSocketService.on('TEST_TYPE', handler2)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.get('TEST_TYPE')).toHaveLength(2)
    })

    it('removes a handler with off', () => {
      const handler = vi.fn()

      webSocketService.on('TEST_TYPE', handler)
      webSocketService.off('TEST_TYPE', handler)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.get('TEST_TYPE')).toHaveLength(0)
    })

    it('off does nothing for unregistered handler', () => {
      const handler = vi.fn()
      const other = vi.fn()

      webSocketService.on('TEST_TYPE', handler)
      webSocketService.off('TEST_TYPE', other)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.get('TEST_TYPE')).toHaveLength(1)
    })

    it('off does nothing for unregistered message type', () => {
      const handler = vi.fn()

      webSocketService.off('UNKNOWN_TYPE', handler)

      const service = webSocketService as unknown as {
        handlers: Map<string, ((data: WebSocketMessage<unknown>) => void)[]>
      }
      expect(service.handlers.has('UNKNOWN_TYPE')).toBe(false)
    })
  })

  describe('send', () => {
    it('sends JSON message when WebSocket is open', () => {
      const mockWs = connectWithToken()

      const message = {
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 10,
        payload: 'hello'
      }

      webSocketService.send(message)

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('drops message when WebSocket is closed', () => {
      const mockWs = connectWithToken()
      mockWs.readyState = WebSocket.CLOSED

      webSocketService.send({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId: 10,
        payload: 'hello'
      })

      const sendCalls = mockWs.send.mock.calls.filter((call: string[]) =>
        call[0].includes('SEND_MESSAGE')
      )
      expect(sendCalls).toHaveLength(0)
    })

    it('drops message when WebSocket is null', () => {
      setInternalWs(null)

      expect(() =>
        webSocketService.send({
          type: WebSocketMessageType.SEND_MESSAGE,
          recipientId: 10,
          payload: 'hello'
        })
      ).not.toThrow()
    })
  })

  describe('disconnect', () => {
    it('closes WebSocket and sets status to disconnected', () => {
      const mockWs = connectWithToken()

      webSocketService.disconnect()

      expect(mockWs.close).toHaveBeenCalled()
      expect(getInternalWs()).toBeNull()
      expect(connectionState.connectionStatus).toBe('disconnected')
    })

    it('handles disconnect when no WebSocket exists', () => {
      setInternalWs(null)

      expect(() => webSocketService.disconnect()).not.toThrow()
      expect(connectionState.connectionStatus).toBe('disconnected')
    })
  })

  describe('onLifecycle', () => {
    it('notifies every listener for an event, not just the last one', () => {
      const first = vi.fn()
      const second = vi.fn()
      webSocketService.onLifecycle('reconnected', first)
      webSocketService.onLifecycle('reconnected', second)

      const service = webSocketService as unknown as { reconnectAttempts: number }
      service.reconnectAttempts = 1
      connectWithToken()

      expect(first).toHaveBeenCalled()
      expect(second).toHaveBeenCalled()
    })

    it('stops notifying after the returned unsubscribe is called', () => {
      const listener = vi.fn()
      const unsubscribe = webSocketService.onLifecycle('reconnected', listener)

      unsubscribe()

      const service = webSocketService as unknown as { reconnectAttempts: number }
      service.reconnectAttempts = 1
      connectWithToken()

      expect(listener).not.toHaveBeenCalled()
    })

    it('emits connected on a successful open', () => {
      const listener = vi.fn()
      webSocketService.onLifecycle('connected', listener)

      connectWithToken()

      expect(listener).toHaveBeenCalled()
    })

    it('emits disconnected on an intentional disconnect', () => {
      connectWithToken()
      const listener = vi.fn()
      webSocketService.onLifecycle('disconnected', listener)

      webSocketService.disconnect()

      expect(listener).toHaveBeenCalled()
    })
  })

  describe('message dispatch', () => {
    it('dispatches incoming messages to registered handlers', () => {
      const handler = vi.fn()
      webSocketService.on('RECEIVE_MESSAGE', handler)

      const mockWs = connectWithToken()

      const message = { type: 'RECEIVE_MESSAGE', payload: { id: 1, content: 'hello' } }
      mockWs.onmessage?.({ data: JSON.stringify(message) } as MessageEvent)

      expect(handler).toHaveBeenCalledWith(message)
    })

    it('does not dispatch PONG messages to handlers', () => {
      const handler = vi.fn()
      webSocketService.on(WebSocketMessageType.PONG, handler)

      const mockWs = connectWithToken()

      const message = { type: WebSocketMessageType.PONG }
      mockWs.onmessage?.({ data: JSON.stringify(message) } as MessageEvent)

      expect(handler).not.toHaveBeenCalled()
    })

    it('handles messages with no registered handlers without throwing', () => {
      const mockWs = connectWithToken()

      const message = { type: 'UNKNOWN_TYPE', payload: {} }

      expect(() =>
        mockWs.onmessage?.({ data: JSON.stringify(message) } as MessageEvent)
      ).not.toThrow()
    })

    it('dispatches to multiple handlers for the same type', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      webSocketService.on('RECEIVE_MESSAGE', handler1)
      webSocketService.on('RECEIVE_MESSAGE', handler2)

      const mockWs = connectWithToken()

      const message = { type: 'RECEIVE_MESSAGE', payload: { id: 1 } }
      mockWs.onmessage?.({ data: JSON.stringify(message) } as MessageEvent)

      expect(handler1).toHaveBeenCalledWith(message)
      expect(handler2).toHaveBeenCalledWith(message)
    })
  })

  describe('connect', () => {
    it('sets connection status to connected on open', () => {
      connectWithToken()

      expect(connectionState.connectionStatus).toBe('connected')
    })

    it('hands an expired token back to the session layer instead of connecting', () => {
      session.getToken.mockReturnValue(createFakeToken(-1000))

      webSocketService.connect()

      expect(lastCreatedWs).toBeNull()
      expect(connectionState.connectionStatus).toBe('disconnected')
      expect(session.onSessionInvalid).toHaveBeenCalled()
    })

    it('asks the session layer to restore when no token is present', async () => {
      session.getToken.mockReturnValue(null)
      session.restoreSession.mockResolvedValue(false)

      webSocketService.connect()
      await vi.waitFor(() => expect(session.onSessionInvalid).toHaveBeenCalled())

      expect(lastCreatedWs).toBeNull()
    })

    it('reports an auth-failure close to the session layer with a reason', () => {
      const mockWs = connectWithToken()

      mockWs.onclose?.({ code: 4001, reason: 'unauthorized' } as CloseEvent)

      expect(session.onSessionInvalid).toHaveBeenCalledWith('Session expired. Please log in again.')
    })
  })
})
