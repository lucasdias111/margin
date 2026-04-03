import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chatState } from '../ChatState.svelte'
import { spaceState } from '$src/states/SpaceState.svelte'
import type { User } from '$src/interfaces/User'
import type { Margin } from '$src/interfaces/Margin'
import type { Channel } from '$src/interfaces/Channel'
import type { Space } from '$src/interfaces/Space'

vi.mock('$src/states/SpaceState.svelte', () => ({
  spaceState: {
    selectedSpace: null,
    setSelectedSpace: vi.fn(),
    setSpaces: vi.fn()
  }
}))

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'lucas',
    displayName: 'Lucas',
    email: 'lucas@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    isOnline: true,
    ...overrides
  }
}

function buildMargin(overrides: Partial<Margin> = {}): Margin {
  return {
    marginId: 1,
    marginName: 'Test Margin',
    marginDescription: 'A test margin',
    marginIconUrl: null,
    ...overrides
  } as Margin
}

function buildChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 1,
    conversationId: 10,
    name: 'general',
    description: 'General channel',
    spaceId: 1,
    type: 'Communication',
    ...overrides
  }
}

describe('ChatState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chatState.reset()
    chatState.margins = []
  })

  describe('selectMargin', () => {
    it('sets selected margin and hasMargin', () => {
      const margin = buildMargin({ marginId: 5 })

      chatState.selectMargin(margin)

      expect(chatState.selectedMargin).toStrictEqual(margin)
      expect(chatState.hasMargin).toBe(true)
    })

    it('clears selected channel', () => {
      chatState.selectedChannel = buildChannel()

      chatState.selectMargin(buildMargin())

      expect(chatState.selectedChannel).toBeNull()
    })

    it('resets spaces via spaceState', () => {
      chatState.selectMargin(buildMargin())

      expect(spaceState.setSpaces).toHaveBeenCalledWith([])
      expect(spaceState.setSelectedSpace).toHaveBeenCalledWith(null)
    })
  })

  describe('selectUser', () => {
    it('sets selected user', () => {
      const user = buildUser({ id: 2 })

      chatState.selectUser(user)

      expect(chatState.selectedUser).toStrictEqual(user)
    })
  })

  describe('selectChannel', () => {
    it('sets selected channel', () => {
      const channel = buildChannel({ id: 3 })

      chatState.selectChannel(channel)

      expect(chatState.selectedChannel).toStrictEqual(channel)
    })

    it('sets channel to null', () => {
      chatState.selectedChannel = buildChannel()

      chatState.selectChannel(null)

      expect(chatState.selectedChannel).toBeNull()
    })
  })

  describe('selectSpace', () => {
    it('delegates to spaceState.setSelectedSpace', () => {
      const space = { id: 1, name: 'Test' } as unknown as Space

      chatState.selectSpace(space)

      expect(spaceState.setSelectedSpace).toHaveBeenCalledWith(space)
    })

    it('handles null', () => {
      chatState.selectSpace(null)

      expect(spaceState.setSelectedSpace).toHaveBeenCalledWith(null)
    })
  })

  describe('selectPrivateChatContent', () => {
    it('sets content to private when not already private', () => {
      chatState.currentlySelectedContent = 'margin'

      chatState.selectPrivateChatContent()

      expect(chatState.currentlySelectedContent).toBe('private')
    })

    it('keeps private when already private', () => {
      chatState.currentlySelectedContent = 'private'

      chatState.selectPrivateChatContent()

      expect(chatState.currentlySelectedContent).toBe('private')
    })
  })

  describe('updateMarginDetails', () => {
    it('updates selectedMargin when id matches', () => {
      chatState.selectedMargin = buildMargin({ marginId: 1 })
      chatState.margins = [buildMargin({ marginId: 1 })]

      chatState.updateMarginDetails(1, 'New Name', 'New Desc', 'icon.png')

      expect(chatState.selectedMargin?.marginName).toBe('New Name')
      expect(chatState.selectedMargin?.marginDescription).toBe('New Desc')
      expect(chatState.selectedMargin?.marginIconUrl).toBe('icon.png')
    })

    it('does not update selectedMargin when id does not match', () => {
      chatState.selectedMargin = buildMargin({ marginId: 1, marginName: 'Original' })
      chatState.margins = []

      chatState.updateMarginDetails(99, 'New Name', 'New Desc', null)

      expect(chatState.selectedMargin?.marginName).toBe('Original')
    })

    it('updates matching margin in margins list', () => {
      chatState.margins = [
        buildMargin({ marginId: 1, marginName: 'First' }),
        buildMargin({ marginId: 2, marginName: 'Second' })
      ]

      chatState.updateMarginDetails(2, 'Updated', 'Updated Desc', 'new-icon.png')

      expect(chatState.margins[0].marginName).toBe('First')
      expect(chatState.margins[1].marginName).toBe('Updated')
      expect(chatState.margins[1].marginDescription).toBe('Updated Desc')
      expect(chatState.margins[1].marginIconUrl).toBe('new-icon.png')
    })

    it('does not modify non-matching margins in list', () => {
      chatState.margins = [buildMargin({ marginId: 1, marginName: 'Keep' })]

      chatState.updateMarginDetails(99, 'Changed', 'Changed Desc', null)

      expect(chatState.margins[0].marginName).toBe('Keep')
    })
  })

  describe('reset', () => {
    it('resets all state to defaults', () => {
      chatState.selectedUser = buildUser()
      chatState.selectedMargin = buildMargin()
      chatState.selectedChannel = buildChannel()
      chatState.currentlySelectedContent = 'margin'
      chatState.hasMargin = false

      chatState.reset()

      expect(chatState.selectedUser).toBeNull()
      expect(chatState.selectedMargin).toBeNull()
      expect(chatState.selectedChannel).toBeNull()
      expect(chatState.currentlySelectedContent).toBe('private')
      expect(chatState.hasMargin).toBe(true)
    })
  })
})
