import { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionHandler } from '$src/handlers/SessionHandler'
import { inviteService } from '$src/services/ConversationInviteService'
import { marginService } from '$src/services/MarginService'
import { messageLoaderService } from '$src/services/MessageLoaderService'
import { notificationService } from '$src/services/NotificationService'
import { threadService } from '$src/services/ThreadService'
import { usersService } from '$src/services/UsersService'

const RESYNC_COOLDOWN_MS = 2000

class BootstrapService {
  private lastResyncAt = 0

  async loadInitialData(): Promise<void> {
    await sessionHandler.getCurrentUser()
    await messageLoaderService.loadUnreadConversations()
    await usersService.loadRecentChatUsers()
    await inviteService.loadPendingInvites()
    await inviteService.loadSentInvites()
    await notificationService.loadAll()
    await marginService.loadMarginsForUser()
    await threadService.loadInbox()
  }

  async resync(): Promise<void> {
    const now = Date.now()
    if (now - this.lastResyncAt < RESYNC_COOLDOWN_MS) return
    this.lastResyncAt = now

    await messageLoaderService.loadUnreadConversations()
    await usersService.loadRecentChatUsers()
    await threadService.loadInbox()

    await this.reloadOpenConversation()
  }

  private async reloadOpenConversation(): Promise<void> {
    if (navigationState.view === View.Private && navigationState.selectedUser) {
      await messageLoaderService.loadConversationForUser(navigationState.selectedUser, true)
    } else if (navigationState.selectedChannel) {
      await messageLoaderService.loadConversationForChannel(navigationState.selectedChannel, true)
    }
  }
}

export const bootstrapService = new BootstrapService()
