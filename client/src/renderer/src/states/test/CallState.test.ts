import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callState } from '../CallState.svelte'
import type { SFUParticipant } from '$src/interfaces/Calls'
import { buildParticipant, buildUser } from '$src/test-utils/mocks'

describe('CallState', () => {
  beforeEach(() => {
    callState.endCall()
  })

  describe('startP2PCall', () => {
    it('initializes P2P call state', () => {
      const user = buildUser()
      const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'test' }

      callState.startP2PCall(1, user, true, offer)

      expect(callState.isP2PCall).toBe(true)
      expect(callState.isGroupCall).toBe(false)
      expect(callState.callId).toBe(1)
      expect(callState.status).toBe('connecting')
      expect(callState.duration).toBe(0)
      expect(callState.p2pCallState).not.toBeNull()
      expect(callState.p2pCallState?.user).toStrictEqual(user)
      expect(callState.p2pCallState?.isIncoming).toBe(true)
      expect(callState.p2pCallState?.offer).toStrictEqual(offer)
      expect(callState.p2pCallState?.isAudioEnabled).toBe(true)
      expect(callState.p2pCallState?.isVideoEnabled).toBe(false)
    })

    it('defaults isIncoming to false', () => {
      callState.startP2PCall(1, buildUser())

      expect(callState.p2pCallState?.isIncoming).toBe(false)
    })

    it('returns null for groupCallState', () => {
      callState.startP2PCall(1, buildUser())

      expect(callState.groupCallState).toBeNull()
    })
  })

  describe('startGroupCall', () => {
    it('initializes group call state', () => {
      callState.startGroupCall(10, 5)

      expect(callState.isGroupCall).toBe(true)
      expect(callState.isP2PCall).toBe(false)
      expect(callState.callId).toBe(10)
      expect(callState.status).toBe('connecting')
      expect(callState.isMinimized).toBe(true)
      expect(callState.groupCallState).not.toBeNull()
      expect(callState.groupCallState?.channelId).toBe(5)
      expect(callState.groupCallState?.participants).toStrictEqual([])
    })

    it('returns null for p2pCallState', () => {
      callState.startGroupCall(10, 5)

      expect(callState.p2pCallState).toBeNull()
    })
  })

  describe('P2P setters with guard clauses', () => {
    it('sets audio enabled when in P2P call', () => {
      callState.startP2PCall(1, buildUser())

      callState.setAudioEnabled(false)

      expect(callState.p2pCallState?.isAudioEnabled).toBe(false)
    })

    it('no-ops setAudioEnabled when not in P2P call', () => {
      callState.startGroupCall(10, 5)

      expect(() => callState.setAudioEnabled(false)).not.toThrow()
    })

    it('no-ops setAudioEnabled when no active call', () => {
      expect(() => callState.setAudioEnabled(false)).not.toThrow()
    })

    it('sets video enabled', () => {
      callState.startP2PCall(1, buildUser())

      callState.setVideoEnabled(true)

      expect(callState.p2pCallState?.isVideoEnabled).toBe(true)
    })

    it('sets remote video enabled', () => {
      callState.startP2PCall(1, buildUser())

      callState.setRemoteVideoEnabled(true)

      expect(callState.p2pCallState?.isRemoteVideoEnabled).toBe(true)
    })

    it('sets screen sharing with track', () => {
      callState.startP2PCall(1, buildUser())
      const track = { id: 'screen' } as unknown as MediaStreamTrack

      callState.setScreenSharing(true, track)

      expect(callState.p2pCallState?.isScreenSharing).toBe(true)
      expect(callState.p2pCallState?.screenShareTrack).toStrictEqual(track)
    })

    it('sets remote screen sharing with stream', () => {
      callState.startP2PCall(1, buildUser())
      const stream = { id: 'remote-screen' } as unknown as MediaStream

      callState.setRemoteScreenSharing(true, stream)

      expect(callState.p2pCallState?.isRemoteScreenSharing).toBe(true)
      expect(callState.p2pCallState?.remoteScreenStream).toStrictEqual(stream)
    })
  })

  describe('queueCandidate / clearCandidateQueue', () => {
    it('queues ICE candidates', () => {
      callState.startP2PCall(1, buildUser())
      const candidate1: RTCIceCandidateInit = { candidate: 'a', sdpMLineIndex: 0 }
      const candidate2: RTCIceCandidateInit = { candidate: 'b', sdpMLineIndex: 1 }

      callState.queueCandidate(candidate1)
      callState.queueCandidate(candidate2)

      expect(callState.p2pCallState?.candidateQueue).toHaveLength(2)
      expect(callState.p2pCallState?.candidateQueue[0]).toStrictEqual(candidate1)
      expect(callState.p2pCallState?.candidateQueue[1]).toStrictEqual(candidate2)
    })

    it('clears candidate queue', () => {
      callState.startP2PCall(1, buildUser())
      callState.queueCandidate({ candidate: 'a', sdpMLineIndex: 0 })

      callState.clearCandidateQueue()

      expect(callState.p2pCallState?.candidateQueue).toStrictEqual([])
    })

    it('no-ops when not in P2P call', () => {
      callState.startGroupCall(10, 5)

      expect(() => callState.queueCandidate({ candidate: 'a', sdpMLineIndex: 0 })).not.toThrow()
      expect(() => callState.clearCandidateQueue()).not.toThrow()
    })
  })

  describe('group call setters', () => {
    it('sets group video enabled', () => {
      callState.startGroupCall(10, 5)

      callState.setGroupVideoEnabled(true)

      expect(callState.groupCallState?.isVideoEnabled).toBe(true)
    })

    it('sets group screen sharing', () => {
      callState.startGroupCall(10, 5)

      callState.setGroupScreenSharing(true)

      expect(callState.groupCallState?.isScreenSharing).toBe(true)
    })

    it('no-ops group setters when in P2P call', () => {
      callState.startP2PCall(1, buildUser())

      expect(() => callState.setGroupVideoEnabled(true)).not.toThrow()
      expect(() => callState.setGroupScreenSharing(true)).not.toThrow()
    })
  })

  describe('addGroupParticipant / removeGroupParticipant', () => {
    it('adds a new participant', () => {
      callState.startGroupCall(10, 5)
      const participant = buildParticipant({ peerId: 'peer-1' })

      callState.addGroupParticipant(participant)

      expect(callState.groupCallState?.participants).toHaveLength(1)
      expect(callState.groupCallState?.participants[0].peerId).toBe('peer-1')
    })

    it('updates existing participant with same peerId', () => {
      callState.startGroupCall(10, 5)
      const original = buildParticipant({
        peerId: 'peer-1',
        displayName: 'Original'
      } as Partial<SFUParticipant>)
      const updated = buildParticipant({
        peerId: 'peer-1',
        displayName: 'Updated'
      } as Partial<SFUParticipant>)

      callState.addGroupParticipant(original)
      callState.addGroupParticipant(updated)

      expect(callState.groupCallState?.participants).toHaveLength(1)
      expect(callState.groupCallState?.participants[0].displayName).toBe('Updated')
    })

    it('removes a participant by peerId', () => {
      callState.startGroupCall(10, 5)
      callState.addGroupParticipant(buildParticipant({ peerId: 'peer-1' }))
      callState.addGroupParticipant(buildParticipant({ peerId: 'peer-2' }))

      callState.removeGroupParticipant('peer-1')

      expect(callState.groupCallState?.participants).toHaveLength(1)
      expect(callState.groupCallState?.participants[0].peerId).toBe('peer-2')
    })

    it('no-ops when not in group call', () => {
      callState.startP2PCall(1, buildUser())

      expect(() => callState.addGroupParticipant(buildParticipant())).not.toThrow()
      expect(() => callState.removeGroupParticipant('peer-1')).not.toThrow()
    })
  })

  describe('base state', () => {
    it('sets status', () => {
      callState.startP2PCall(1, buildUser())

      callState.setStatus('connected')

      expect(callState.status).toBe('connected')
    })

    it('increments duration', () => {
      callState.startP2PCall(1, buildUser())

      callState.incrementDuration()
      callState.incrementDuration()

      expect(callState.duration).toBe(2)
    })

    it('toggles minimized', () => {
      callState.startP2PCall(1, buildUser())

      expect(callState.isMinimized).toBe(false)

      callState.toggleMinimized()
      expect(callState.isMinimized).toBe(true)

      callState.toggleMinimized()
      expect(callState.isMinimized).toBe(false)
    })

    it('clears the previous duration interval when setDurationInterval is called again', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      callState.startP2PCall(1, buildUser())

      callState.setDurationInterval(111)
      callState.setDurationInterval(222)

      expect(clearIntervalSpy).toHaveBeenCalledWith(111)
      clearIntervalSpy.mockRestore()
    })
  })

  describe('endCall', () => {
    it('resets all state', () => {
      callState.startP2PCall(1, buildUser())
      callState.setStatus('connected')
      callState.setVideoEnabled(true)
      callState.incrementDuration()

      callState.endCall()

      expect(callState.callId).toBeNull()
      expect(callState.status).toBe('ended')
      expect(callState.duration).toBe(0)
      expect(callState.isP2PCall).toBe(false)
      expect(callState.isGroupCall).toBe(false)
      expect(callState.p2pCallState).toBeNull()
      expect(callState.groupCallState).toBeNull()
      expect(callState.isMinimized).toBe(false)
    })

    it('clears duration interval', () => {
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
      callState.startP2PCall(1, buildUser())
      callState.setDurationInterval(999)

      callState.endCall()

      expect(clearIntervalSpy).toHaveBeenCalledWith(999)
      clearIntervalSpy.mockRestore()
    })

    it('handles endCall when no active call', () => {
      expect(() => callState.endCall()).not.toThrow()
    })
  })
})
