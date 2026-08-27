import { beforeEach, describe, expect, it } from 'vitest'
import { callState } from '$src/states/CallState.svelte'

describe('CallState meeting calls', () => {
  beforeEach(() => callState.endCall())

  it('starts a meeting call with a prefixed room id and no channel', () => {
    callState.startMeetingCall('abc123', 'm_abc123', 'Weekly sync')

    expect(callState.isGroupCall).toBe(true)
    expect(callState.groupCallState?.roomId).toBe('m_abc123')
    expect(callState.groupCallState?.meetingCode).toBe('abc123')
    expect(callState.groupCallState?.title).toBe('Weekly sync')
  })

  it('leaves channelId null so a meeting never marks a channel as in-call', () => {
    callState.startMeetingCall('abc123', 'm_abc123', null)

    expect(callState.groupCallState?.channelId).toBeNull()
  })

  it('still sets a bare numeric room id for channel calls', () => {
    callState.startGroupCall(5, 5)

    expect(callState.groupCallState?.roomId).toBe('5')
    expect(callState.groupCallState?.channelId).toBe(5)
    expect(callState.groupCallState?.meetingCode).toBeNull()
  })

  it('tracks participants for a meeting the same way as a channel call', () => {
    callState.startMeetingCall('abc123', 'm_abc123', null)
    callState.addGroupParticipant({
      peerId: '7',
      displayName: 'Alice',
      profilePictureUrl: null,
      audioStream: null,
      videoStream: null,
      screenStream: null,
      isVideoEnabled: false,
      isScreenSharing: false
    })

    expect(callState.groupCallState?.participants).toHaveLength(1)

    callState.removeGroupParticipant('7')
    expect(callState.groupCallState?.participants).toHaveLength(0)
  })
})
