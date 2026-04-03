import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { webSocketService } from '../WebSocketService'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'

vi.mock('$src/states/ConnectionState.svelte', () => ({
  connectionState: {
    connectionStatus: 'disconnected'
  }
}))

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    tryRestoreSession: vi.fn(),
    logoutUser: vi.fn().mockResolvedValue(undefined)
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

vi.mock('svelte-spa-router', () => ({
  push: vi.fn()
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
    reconnectAttempts: number
    intentionalDisconnect: boolean
    isConnecting: boolean
    onReconnectCallback: (() => void) | null
  }
  service.handlers.clear()
  service.reconnectAttempts = 0
  service.intentionalDisconnect = false
  service.isConnecting = false
  service.onReconnectCallback = null
}

function connectWithToken(): MockWebSocket {
  sessionStorage.setItem('authToken', 'test-token')
  webSocketService.connect()
  lastCreatedWs!.readyState = WebSocket.OPEN
  lastCreatedWs!.onopen?.({} as Event)
  return lastCreatedWs!
}

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    installWebSocketMock()
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

  describe('onReconnect', () => {
    it('stores the reconnect callback', () => {
      const callback = vi.fn()

      webSocketService.onReconnect(callback)

      const stored = (webSocketService as unknown as { onReconnectCallback: (() => void) | null })
        .onReconnectCallback
      expect(stored).toBe(callback)
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

    it('fires reconnect callback when reconnecting successfully', () => {
      const callback = vi.fn()
      webSocketService.onReconnect(callback)

      sessionStorage.setItem('authToken', 'test-token')
      const service = webSocketService as unknown as { reconnectAttempts: number }
      service.reconnectAttempts = 1

      webSocketService.connect()
      lastCreatedWs!.readyState = WebSocket.OPEN
      lastCreatedWs!.onopen?.({} as Event)

      expect(callback).toHaveBeenCalled()
    })

    it('does not fire reconnect callback on first connect', () => {
      const callback = vi.fn()
      webSocketService.onReconnect(callback)

      connectWithToken()

      expect(callback).not.toHaveBeenCalled()
    })
  })
})
