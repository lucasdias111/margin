import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navigation from './Navigation.svelte'
import { userState } from '$src/states/UserState.svelte.js'
import { chatService } from '$src/services/ChatService'
import { authenticationService } from '$src/services/AuthenticationService'
import * as svelteRouter from 'svelte-spa-router'

vi.mock('$src/states/ChatState.svelte.js', () => ({
  chatState: {
    currentlySelectedContent: 'private'
  }
}))

vi.mock('$src/states/NotificationState.svelte.js', () => ({
  notificationState: {
    getTotalUnseenNotifications: vi.fn().mockReturnValue(0),
    getTotalUnreadDirectMessages: vi.fn().mockReturnValue(0),
    getTotalUnreadChannelMessages: vi.fn().mockReturnValue(0)
  }
}))

vi.mock('$src/states/UserState.svelte.js', () => ({
  userState: {
    currentUser: {
      id: 1,
      displayName: 'Lucas',
      profilePictureUrl: '/avatar.png'
    }
  }
}))

vi.mock('$src/services/ChatService', () => ({
  chatService: {
    selectContent: vi.fn()
  }
}))

vi.mock('$src/services/AuthenticationService', () => ({
  authenticationService: {
    logoutUser: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('svelte-spa-router', () => ({
  push: vi.fn()
}))

vi.mock('$src/components/common/user/UserAvatar.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/chat/UnreadNotificationBadge.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/icons/Icon.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/actions/clickOutside', () => ({
  clickOutside: vi.fn()
}))

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    userState.currentUser = {
      id: 1,
      displayName: 'Lucas',
      profilePictureUrl: '/avatar.png'
    } as any
  })

  it('renders navigation buttons', () => {
    render(Navigation)

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /private conversations/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spaces/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('calls chatService.selectContent with "notifications" when notifications button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /notifications/i }))

    expect(chatService.selectContent).toHaveBeenCalledWith('notifications')
  })

  it('calls chatService.selectContent with "private" when private conversations button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /private conversations/i }))

    expect(chatService.selectContent).toHaveBeenCalledWith('private')
  })

  it('calls chatService.selectContent with "margin" when spaces button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /spaces/i }))

    expect(chatService.selectContent).toHaveBeenCalledWith('margin')
  })

  it('calls chatService.selectContent with "settings" when settings button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /settings/i }))

    expect(chatService.selectContent).toHaveBeenCalledWith('settings')
  })

  it('renders avatar button when user is logged in', () => {
    render(Navigation)

    const avatarButton = document.querySelector('.avatar-btn')
    expect(avatarButton).toBeInTheDocument()
  })

  it('does not render avatar button when no user is logged in', () => {
    userState.currentUser = null as any
    render(Navigation)

    const avatarButton = document.querySelector('.avatar-btn')
    expect(avatarButton).not.toBeInTheDocument()
  })

  it('toggles dropdown when avatar button is clicked', async () => {
    render(Navigation)

    const avatarButton = document.querySelector('.avatar-btn')!

    expect(document.querySelector('.dropdown')).not.toBeInTheDocument()

    await fireEvent.click(avatarButton)

    expect(document.querySelector('.dropdown')).toBeInTheDocument()
  })

  it('displays user display name in dropdown', async () => {
    render(Navigation)

    await fireEvent.click(document.querySelector('.avatar-btn')!)

    expect(screen.getByText('Lucas')).toBeInTheDocument()
  })

  it('calls logoutUser and navigates to / when log out is clicked', async () => {
    render(Navigation)

    await fireEvent.click(document.querySelector('.avatar-btn')!)
    await fireEvent.click(screen.getByText('Log out'))

    await waitFor(() => {
      expect(authenticationService.logoutUser).toHaveBeenCalled()
      expect(svelteRouter.push).toHaveBeenCalledWith('/')
    })
  })

  it('does not log out when currentUser has no id', async () => {
    userState.currentUser = { id: null } as any
    render(Navigation)

    await fireEvent.click(document.querySelector('.avatar-btn')!)
    await fireEvent.click(screen.getByText('Log out'))

    expect(authenticationService.logoutUser).not.toHaveBeenCalled()
  })

  it('closes dropdown when avatar is clicked again', async () => {
    render(Navigation)

    const avatarButton = document.querySelector('.avatar-btn')!

    await fireEvent.click(avatarButton)
    expect(document.querySelector('.dropdown')).toBeInTheDocument()

    await fireEvent.click(avatarButton)
    expect(document.querySelector('.dropdown')).not.toBeInTheDocument()
  })
})
