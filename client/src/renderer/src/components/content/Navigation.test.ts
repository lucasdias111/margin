import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Navigation from './Navigation.svelte'
import { navigationService } from '$src/services/NavigationService'
import { authenticationService } from '$src/services/AuthenticationService'
import * as svelteRouter from 'svelte-spa-router'
import { sessionState } from '$src/states/SessionState.svelte'

vi.mock('$src/states/NotificationState.svelte.js', () => ({
  notificationState: {
    getTotalUnseenNotifications: vi.fn().mockReturnValue(0)
  }
}))

vi.mock('$src/services/NavigationService', () => ({
  navigationService: {
    setView: vi.fn()
  }
}))

vi.mock('$src/services/NotificationService', () => ({
  notificationService: {
    totalUnreadDirectMessages: vi.fn().mockReturnValue(0),
    totalUnreadChannelMessages: vi.fn().mockReturnValue(0)
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

vi.mock('$src/assets/marginIconSvg.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/components/common/modals/BugReportModal.svelte', () => ({
  default: vi.fn()
}))

vi.mock('$src/actions/clickOutside', () => ({
  clickOutside: vi.fn()
}))

describe('Navigation', () => {
  beforeEach(() => {
    sessionState.currentUser = {
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
  })

  it('calls chatService.selectContent with "notifications" when notifications button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /notifications/i }))

    expect(navigationService.setView).toHaveBeenCalledWith('notifications')
  })

  it('calls chatService.selectContent with "private" when private conversations button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /private conversations/i }))

    expect(navigationService.setView).toHaveBeenCalledWith('private')
  })

  it('calls chatService.selectContent with "margin" when spaces button is clicked', async () => {
    render(Navigation)

    await fireEvent.click(screen.getByRole('button', { name: /spaces/i }))

    expect(navigationService.setView).toHaveBeenCalledWith('margin')
  })

  it('renders avatar button when user is logged in', () => {
    render(Navigation)

    const avatarButton = document.querySelector('.avatar-btn')
    expect(avatarButton).toBeInTheDocument()
  })

  it('does not render avatar button when no user is logged in', () => {
    sessionState.currentUser = null as any
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

  it('calls chatService.selectContent with "settings" when settings is clicked in dropdown', async () => {
    render(Navigation)

    await fireEvent.click(document.querySelector('.avatar-btn')!)
    await fireEvent.click(screen.getByText('Settings'))

    expect(navigationService.setView).toHaveBeenCalledWith('settings')
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
    sessionState.currentUser = { id: null } as any
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
