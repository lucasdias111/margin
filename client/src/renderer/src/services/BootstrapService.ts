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

/**
 * Owns what the authenticated session needs loaded — once at startup, and again
 * whenever the client has been out of touch (socket reconnect, or the OS
 * reporting the user active again after idle).
 */
class BootstrapService {
  private lastResyncAt = 0

  /**
   * Kept sequential deliberately — the order is load-bearing:
   * - `getCurrentUser` must resolve first; the loads below decrypt with it.
   * - `loadRecentChatUsers` carries over `meta.unread`, so
   *   `loadUnreadConversations` has to have run.
   * - `loadInbox` calls `threadsState.setInbox`, which clears and repopulates
   *   thread unread from the server, so it has to run *after*
   *   `loadUnreadConversations` marks threads unread — otherwise those marks
   *   survive and contradict the inbox.
   */
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

  /** Re-reads anything that may have drifted, plus the conversation on screen. */
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
