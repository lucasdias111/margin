import { beforeEach, describe, expect, it, vi } from 'vitest'
import { incomingCallService } from '../call/IncomingCallService'
import { callService } from '$src/services/call/CallService'
import { channelCallService } from '$src/services/call/ChannelCallService'
import { incomingCallState } from '$src/states/IncomingCallState.svelte'
import { buildUser } from '$src/test-utils/mocks'

vi.mock('$src/services/call/CallService', () => ({
  callService: { startCall: vi.fn(), rejectCall: vi.fn() }
}))

vi.mock('$src/services/call/ChannelCallService', () => ({
  channelCallService: { joinVoiceChannel: vi.fn() }
}))

const caller = buildUser({ id: 2, displayName: 'Caller' })

function offer(): void {
  incomingCallState.setOffer({ callId: 99, caller, sdp: 'sdp-blob', callType: 'AUDIO' })
}

describe('IncomingCallService', () => {
  beforeEach(() => {
    incomingCallState.clear()
  })

  describe('acceptCall', () => {
    it('starts the call from the pending offer and clears it', () => {
      offer()

      incomingCallService.acceptCall()

      expect(callService.startCall).toHaveBeenCalledWith(99, caller, true, false, {
        type: 'offer',
        sdp: 'sdp-blob'
      })
      expect(incomingCallState.offer).toBeNull()
    })

    it('does nothing when there is no pending offer', () => {
      incomingCallService.acceptCall()

      expect(callService.startCall).not.toHaveBeenCalled()
    })
  })

  describe('declineCall', () => {
    it('rejects the call and clears the offer', () => {
      offer()

      incomingCallService.declineCall()

      expect(callService.rejectCall).toHaveBeenCalledWith(99, caller.id)
      expect(incomingCallState.offer).toBeNull()
    })

    it('does nothing when there is no pending offer', () => {
      expect(() => incomingCallService.declineCall()).not.toThrow()
      expect(callService.rejectCall).not.toHaveBeenCalled()
    })
  })

  describe('channel call invites', () => {
    it('joins the voice channel and clears the invite', () => {
      incomingCallState.setChannelInvite({ channelId: 5, channelName: 'general', fromUser: caller })

      incomingCallService.acceptChannelInvite()

      expect(channelCallService.joinVoiceChannel).toHaveBeenCalledWith(5)
      expect(incomingCallState.channelInvite).toBeNull()
    })

    it('clears the invite on decline without joining', () => {
      incomingCallState.setChannelInvite({ channelId: 5, channelName: 'general', fromUser: caller })

      incomingCallService.declineChannelInvite()

      expect(channelCallService.joinVoiceChannel).not.toHaveBeenCalled()
      expect(incomingCallState.channelInvite).toBeNull()
    })

    it('expires the invite after the timeout', () => {
      vi.useFakeTimers()

      try {
        incomingCallState.setChannelInvite({
          channelId: 5,
          channelName: 'general',
          fromUser: caller
        })
        expect(incomingCallState.isRinging).toBe(true)

        vi.advanceTimersByTime(20_000)

        expect(incomingCallState.channelInvite).toBeNull()
        expect(incomingCallState.isRinging).toBe(false)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
