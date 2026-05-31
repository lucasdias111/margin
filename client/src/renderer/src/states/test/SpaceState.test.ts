import { beforeEach, describe, expect, it, vi } from 'vitest'
import { spaceState } from '../SpaceState.svelte'
import type { Channel } from '$src/interfaces/Channel'
import { channelService } from '$src/services/ChannelService'
import { navigationState } from '$src/states/NavigationState.svelte'
import { spaceService } from '$src/services/SpaceService'
import { buildChannel, buildSpace, buildUser } from '$src/test-utils/mocks'

vi.mock('$src/states/ChatState.svelte', () => ({
  chatState: {
    selectedChannel: null as Channel | null
  }
}))

describe('SpaceState', () => {
  beforeEach(() => {
    spaceState.setSpaces([])
    navigationState.selectedSpace = null
    navigationState.selectedChannel = null
  })

  describe('setSpaces', () => {
    it('sets spaces', () => {
      const spaces = [buildSpace({ spaceId: 1 }), buildSpace({ spaceId: 2 })]

      spaceState.setSpaces(spaces)

      expect(spaceState.spaces).toHaveLength(2)
    })
  })

  describe('setSelectedSpace', () => {
    it('sets selected space', () => {
      const space = buildSpace({ spaceId: 1 })

      navigationState.selectedSpace = space

      expect(navigationState.selectedSpace?.spaceId).toBe(1)
    })

    it('sets to null', () => {
      navigationState.selectedSpace = buildSpace()
      navigationState.selectedSpace = null

      expect(navigationState.selectedSpace).toBeNull()
    })
  })

  describe('updateVoiceParticipant', () => {
    it('adds user to voice participants on join', () => {
      const user = buildUser({ id: 5 })
      const channel = buildChannel({ id: 10, voiceParticipants: [] })
      spaceState.setSpaces([buildSpace({ channels: [channel] })])

      channelService.updateVoiceParticipant(10, user, true)

      const updated = spaceState.spaces[0].channels![0]
      expect(updated.voiceParticipants).toHaveLength(1)
      expect(updated.voiceParticipants![0].id).toBe(5)
    })

    it('removes user from voice participants on leave', () => {
      const user = buildUser({ id: 5 })
      const channel = buildChannel({ id: 10, voiceParticipants: [user] })
      spaceState.setSpaces([buildSpace({ channels: [channel] })])

      channelService.updateVoiceParticipant(10, user, false)

      const updated = spaceState.spaces[0].channels![0]
      expect(updated.voiceParticipants).toHaveLength(0)
    })

    it('replaces existing user on join to avoid duplicates', () => {
      const user = buildUser({ id: 5, displayName: 'Original' })
      const channel = buildChannel({ id: 10, voiceParticipants: [user] })
      spaceState.setSpaces([buildSpace({ channels: [channel] })])

      const updatedUser = buildUser({ id: 5, displayName: 'Updated' })
      channelService.updateVoiceParticipant(10, updatedUser, true)

      const updated = spaceState.spaces[0].channels![0]
      expect(updated.voiceParticipants).toHaveLength(1)
      expect(updated.voiceParticipants![0].displayName).toBe('Updated')
    })

    it('syncs navigationState.selectedChannel when it matches', () => {
      const user = buildUser({ id: 5 })
      const channel = buildChannel({ id: 10, voiceParticipants: [] })
      spaceState.setSpaces([buildSpace({ channels: [channel] })])
      navigationState.selectedChannel = buildChannel({ id: 10, voiceParticipants: [] })

      channelService.updateVoiceParticipant(10, user, true)

      expect(navigationState.selectedChannel?.voiceParticipants).toHaveLength(1)
    })

    it('does not sync navigationState.selectedChannel when id does not match', () => {
      const user = buildUser({ id: 5 })
      const channel = buildChannel({ id: 10, voiceParticipants: [] })
      spaceState.setSpaces([buildSpace({ channels: [channel] })])
      navigationState.selectedChannel = buildChannel({ id: 99, voiceParticipants: [] })

      channelService.updateVoiceParticipant(10, user, true)

      expect(navigationState.selectedChannel?.voiceParticipants).toHaveLength(0)
    })

    it('handles channel not found in any space', () => {
      spaceState.setSpaces([buildSpace({ channels: [buildChannel({ id: 10 })] })])

      expect(() => channelService.updateVoiceParticipant(999, buildUser(), true)).not.toThrow()
    })

    it('handles undefined voiceParticipants on join', () => {
      const channel = buildChannel({ id: 10 })
      channel.voiceParticipants = undefined
      spaceState.setSpaces([buildSpace({ channels: [channel] })])

      channelService.updateVoiceParticipant(10, buildUser({ id: 5 }), true)

      expect(spaceState.spaces[0].channels![0].voiceParticipants).toHaveLength(1)
    })
  })

  describe('addMemberToSpace', () => {
    it('adds member to space', () => {
      const user = buildUser({ id: 5 })
      spaceState.setSpaces([buildSpace({ spaceId: 1, members: [] })])

      spaceService.addMemberToSpace(1, user)

      expect(spaceState.spaces[0].members).toHaveLength(1)
      expect(spaceState.spaces[0].members[0].user.id).toBe(5)
      expect(spaceState.spaces[0].members[0].role).toBe('MEMBER')
    })

    it('does not add duplicate member', () => {
      const user = buildUser({ id: 5 })
      const existingMember = { user, spaceId: 1, role: 'MEMBER', joinedAt: '2025-01-01T00:00:00Z' }
      spaceState.setSpaces([buildSpace({ spaceId: 1, members: [existingMember] })])

      spaceService.addMemberToSpace(1, user)

      expect(spaceState.spaces[0].members).toHaveLength(1)
    })

    it('does nothing when space is not found', () => {
      spaceState.setSpaces([buildSpace({ spaceId: 1, members: [] })])

      spaceService.addMemberToSpace(99, buildUser({ id: 5 }))

      expect(spaceState.spaces[0].members).toHaveLength(0)
    })

    it('syncs selectedSpace when it matches', () => {
      const space = buildSpace({ spaceId: 1, members: [] })
      spaceState.setSpaces([space])
      navigationState.selectedSpace = space

      spaceService.addMemberToSpace(1, buildUser({ id: 5 }))

      expect(navigationState.selectedSpace?.members).toHaveLength(1)
    })

    it('does not sync selectedSpace when id does not match', () => {
      spaceState.setSpaces([
        buildSpace({ spaceId: 1, members: [] }),
        buildSpace({ spaceId: 2, members: [] })
      ])
      navigationState.selectedSpace = buildSpace({ spaceId: 2, members: [] })

      spaceService.addMemberToSpace(1, buildUser({ id: 5 }))

      expect(navigationState.selectedSpace?.members).toHaveLength(0)
    })
  })
})
