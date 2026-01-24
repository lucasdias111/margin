// CallWindow.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import CallWindow from './CallWindow.svelte'
import { callState } from '$src/states/CallState.svelte'
import { webSocketService } from '$src/services/WebSocketService'
import { callService } from '$src/services/CallService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'

vi.mock('$src/services/WebSocketService', () => ({
  webSocketService: {
    on: vi.fn(),
    off: vi.fn()
  }
}))

vi.mock('$src/services/CallService', () => ({
  callService: {
    initiateCall: vi.fn(),
    answerCall: vi.fn(),
    handleCallResponse: vi.fn(),
    handleIceCandidate: vi.fn(),
    endCall: vi.fn(),
    cleanup: vi.fn(),
    onRemoteStream: vi.fn()
  }
}))

describe('CallWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callState.endCall()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when there is no active call', () => {
    const { container } = render(CallWindow)

    expect(container.querySelector('.call-window')).not.toBeInTheDocument()
  })

  it('renders call window when there is an active call', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connecting')

    render(CallWindow)

    expect(screen.getByText('Call with 123')).toBeInTheDocument()
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
  })

  it('initiates outgoing call on mount', () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    expect(callService.initiateCall).toHaveBeenCalledWith(123)
  })

  it('answers incoming call on mount', () => {
    const mockOffer = { type: 'offer' as RTCSdpType, sdp: 'mock-sdp' }
    callState.startCall(1, 123, true, mockOffer)

    render(CallWindow)

    expect(callService.answerCall).toHaveBeenCalledWith(123, mockOffer)
  })

  it('registers websocket event listeners on mount', () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    expect(webSocketService.on).toHaveBeenCalledWith(
      WebSocketMessageType.CALL_RESPONSE,
      expect.any(Function)
    )
    expect(webSocketService.on).toHaveBeenCalledWith(
      WebSocketMessageType.CALL_CANDIDATE,
      expect.any(Function)
    )
  })

  it('displays connecting status', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connecting')

    render(CallWindow)

    const status = screen.getByText('Connecting...')
    expect(status).toBeInTheDocument()
    expect(status.className).toContain('connecting')
  })

  it('displays connected status with duration', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connected')

    // Simulate 125 seconds (2 minutes 5 seconds)
    for (let i = 0; i < 125; i++) {
      callState.incrementDuration()
    }

    render(CallWindow)

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('02:05')).toBeInTheDocument()
  })

  it('formats duration correctly - zero seconds', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connected')

    render(CallWindow)

    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('formats duration correctly - 59 seconds', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connected')

    for (let i = 0; i < 59; i++) {
      callState.incrementDuration()
    }

    render(CallWindow)

    expect(screen.getByText('00:59')).toBeInTheDocument()
  })

  it('formats duration correctly - 1 minute', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connected')

    for (let i = 0; i < 60; i++) {
      callState.incrementDuration()
    }

    render(CallWindow)

    expect(screen.getByText('01:00')).toBeInTheDocument()
  })

  it('formats duration correctly - over 60 minutes', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('connected')

    for (let i = 0; i < 3661; i++) {
      callState.incrementDuration()
    }

    render(CallWindow)

    expect(screen.getByText('61:01')).toBeInTheDocument()
  })

  it('displays ended status', () => {
    callState.startCall(1, 123, false)
    callState.setStatus('ended')

    render(CallWindow)

    const status = screen.getByText('Call Ended')
    expect(status).toBeInTheDocument()
    expect(status.className).toContain('ended')
  })

  it('calls endCall when end call button is clicked', async () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    const endButton = screen.getByRole('button', { name: /end call/i })
    await fireEvent.click(endButton)

    expect(callService.endCall).toHaveBeenCalledWith(false)
  })

  it('sets up remote audio stream handler', () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    expect(callService.onRemoteStream).toHaveBeenCalledWith(expect.any(Function))
  })

  it('cleans up event listeners on unmount', () => {
    callState.startCall(1, 123, false)

    const { unmount } = render(CallWindow)
    unmount()

    expect(webSocketService.off).toHaveBeenCalledWith(
      WebSocketMessageType.CALL_RESPONSE,
      expect.any(Function)
    )
    expect(webSocketService.off).toHaveBeenCalledWith(
      WebSocketMessageType.CALL_CANDIDATE,
      expect.any(Function)
    )
    expect(callService.cleanup).toHaveBeenCalled()
  })

  it('displays user avatar with userId', () => {
    callState.startCall(1, 456, false)

    render(CallWindow)

    const avatar = document.querySelector('.avatar-circle')
    expect(avatar).toBeInTheDocument()
    expect(avatar?.textContent).toContain('456')
  })

  it('renders audio element with autoplay', () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    const audio = document.querySelector('audio')
    expect(audio).toBeInTheDocument()
    expect(audio?.hasAttribute('autoplay')).toBe(true)
  })

  it('handles call response message', async () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    const callResponseHandler = vi
      .mocked(webSocketService.on)
      .mock.calls.find((call) => call[0] === WebSocketMessageType.CALL_RESPONSE)?.[1]

    const mockMessage = {
      type: WebSocketMessageType.CALL_RESPONSE,
      payload: { answer: { type: 'answer' as RTCSdpType, sdp: 'mock-sdp' } }
    }

    await callResponseHandler?.(mockMessage)

    expect(callService.handleCallResponse).toHaveBeenCalledWith(mockMessage)
  })

  it('handles ICE candidate message', async () => {
    callState.startCall(1, 123, false)

    render(CallWindow)

    const iceCandidateHandler = vi
      .mocked(webSocketService.on)
      .mock.calls.find((call) => call[0] === WebSocketMessageType.CALL_CANDIDATE)?.[1]

    const mockMessage = {
      type: WebSocketMessageType.CALL_CANDIDATE,
      payload: {
        candidate: 'mock-candidate',
        sdpMid: 'audio',
        sdpMLineIndex: 0,
        usernameFragment: 'mock-fragment'
      }
    }

    await iceCandidateHandler?.(mockMessage)

    expect(callService.handleIceCandidate).toHaveBeenCalledWith({
      candidate: 'mock-candidate',
      sdpMid: 'audio',
      sdpMLineIndex: 0,
      usernameFragment: 'mock-fragment'
    })
  })

  it('does not initiate call when no active call on mount', () => {
    render(CallWindow)

    expect(callService.initiateCall).not.toHaveBeenCalled()
    expect(callService.answerCall).not.toHaveBeenCalled()
  })
})
