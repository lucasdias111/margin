import { beforeEach, describe, expect, it, vi } from 'vitest'
import { navigationService } from '../NavigationService'
import { navigationState } from '$src/states/NavigationState.svelte'
import { channelService } from '$src/services/ChannelService'
import { View } from '$src/interfaces/View'
import { buildUser } from '$src/test-utils/mocks'

vi.mock('$src/services/ChannelService', () => ({
  channelService: {
    select: vi.fn()
  }
}))

beforeEach(() => {
  navigationState.view = View.Private
  navigationState.selectedUser = null
  navigationState.selectedGroupConversation = null
  vi.clearAllMocks()
})

describe('NavigationService', () => {
  describe('selectContent', () => {
    it('sets the view', () => {
      navigationService.selectContent(View.Margin)

      expect(navigationState.view).toBe(View.Margin)
    })

    it('clears selectedUser when changing views', () => {
      navigationState.selectedUser = buildUser({ id: 2 })

      navigationService.selectContent(View.Margin)

      expect(navigationState.selectedUser).toBeNull()
    })

    it('does not clear selectedUser when selecting the same view', () => {
      const user = buildUser({ id: 2 })
      navigationState.selectedUser = user

      navigationService.selectContent(View.Private)

      expect(navigationState.selectedUser).toEqual(user)
    })

    it('always deselects the active channel', () => {
      navigationService.selectContent(View.Margin)

      expect(channelService.select).toHaveBeenCalledWith(null)
    })
  })
})
