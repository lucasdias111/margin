import { beforeEach, describe, expect, it } from 'vitest'
import { navigationService } from '../NavigationService'
import { navigationState } from '$src/states/NavigationState.svelte'
import { View } from '$src/interfaces/View'
import { buildUser } from '$src/test-utils/mocks'
import type { GroupConversation } from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'

beforeEach(() => {
  navigationState.view = View.Private
  navigationState.selectedUser = null
  navigationState.selectedGroupConversation = null
  navigationState.selectedChannel = null
  navigationState.selectedSpace = null
  navigationState.selectedMargin = null
})

describe('NavigationService', () => {
  describe('setView', () => {
    it('sets the view', () => {
      navigationService.setView(View.Margin)

      expect(navigationState.view).toBe(View.Margin)
    })

    it('keeps the selected private chat when switching views and back', () => {
      const user = buildUser({ id: 2 })
      navigationState.selectedUser = user

      navigationService.setView(View.Margin)
      navigationService.setView(View.Private)

      expect(navigationState.selectedUser).toEqual(user)
    })

    it('keeps the selected group conversation when switching views and back', () => {
      const group = { id: 7, type: 'GROUP' } as GroupConversation
      navigationState.selectedGroupConversation = group

      navigationService.setView(View.Margin)
      navigationService.setView(View.Private)

      expect(navigationState.selectedGroupConversation).toEqual(group)
    })

    it('keeps the selected channel when switching views and back', () => {
      const channel = { id: 3, name: 'general' } as Channel
      navigationState.selectedChannel = channel

      navigationService.setView(View.Private)
      navigationService.setView(View.Margin)

      expect(navigationState.selectedChannel).toEqual(channel)
    })
  })

  describe('reset', () => {
    it('clears all selections and returns to the private view', () => {
      navigationState.view = View.Margin
      navigationState.selectedUser = buildUser({ id: 2 })
      navigationState.selectedGroupConversation = { id: 7, type: 'GROUP' } as GroupConversation
      navigationState.selectedChannel = { id: 3, name: 'general' } as Channel

      navigationService.reset()

      expect(navigationState.view).toBe(View.Private)
      expect(navigationState.selectedUser).toBeNull()
      expect(navigationState.selectedGroupConversation).toBeNull()
      expect(navigationState.selectedChannel).toBeNull()
      expect(navigationState.selectedSpace).toBeNull()
      expect(navigationState.selectedMargin).toBeNull()
    })
  })
})
