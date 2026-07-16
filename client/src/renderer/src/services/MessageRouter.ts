import type { Message } from '$src/interfaces/Messages'
import { type DirectConversation, type GroupConversation } from '$src/interfaces/Conversation'
import { encryptionService } from './EncryptionService'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState } from '$src/states/ConversationsState.svelte.js'
import { notificationService } from '$src/services/NotificationService'
import { messageSenderService } from './MessageSenderService'
import { messageLoaderService } from './MessageLoaderService'
import { threadService } from './ThreadService'
import { threadsState } from '$src/states/ThreadsState.svelte'

class MessageRouter {
  handleIncomingMessage = async (data: WebSocketMessage<Message>): Promise<void> => {
    const msg = data.payload
    if (msg.conversationType === 'THREAD') {
      await this.handleIncomingThreadMessage(msg)
    } else if (msg.conversationType === 'CHANNEL') {
      await this.handleIncomingChannelMessage(msg)
    } else if (msg.conversationType === 'GROUP') {
      await this.handleIncomingGroupMessage(msg)
    } else {
      await this.handleIncomingDirectMessage(msg)
    }
  }

  private handleIncomingThreadMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id

    const isKnownPost = conversationsState.byId.has(msg.conversationId)
    if (isKnownPost) {
      threadsState.noteReply(msg.conversationId, msg.createdAt)
    } else if (msg.parentConversationId) {
      const channel = navigationState.selectedChannel
      if (channel && channel.conversationId === msg.parentConversationId) {
        void threadService.loadPostsForChannel(channel)
      }
    }

    const isActive = navigationState.selectedThread?.id === msg.conversationId

    if (isFromMe && messageSenderService.replaceOptimisticIfPresent(msg)) {
      return
    }

    if (conversationsState.messagesByConversationId.has(msg.conversationId)) {
      conversationsState.appendMessage(msg, !isFromMe)
    }

    if (isFromMe) return

    if (isActive && document.hasFocus()) {
      await threadService.markThreadAsRead(msg.conversationId)
    } else if (threadsState.isFollowing(msg.conversationId)) {
      threadsState.markUnread(msg.conversationId)
      notificationService.notifyIncomingMessage(msg)
    }
  }

  private handleIncomingChannelMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const isActive =
      navigationState.view === View.Margin &&
      msg.conversationId === navigationState.selectedChannel?.conversationId

    if (isFromMe && messageSenderService.replaceOptimisticIfPresent(msg)) {
      if (isActive && document.hasFocus()) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await messageLoaderService.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isFromMe) return

    if (isActive && document.hasFocus()) {
      await messageLoaderService.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      notificationService.notifyIncomingMessage(msg)
    }
  }

  private handleIncomingDirectMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const otherUser = isFromMe ? navigationState.selectedUser : msg.user
    const otherUserId = otherUser?.id

    if (!otherUser || !otherUserId) return

    const conv = [...conversationsState.byId.values()].find(
      (c) => c.type === 'DIRECT' && c.otherUserId === otherUserId
    ) as DirectConversation | undefined

    const shouldDecrypt = conv ? conv.encrypted : true
    try {
      if (shouldDecrypt) {
        msg.content = await encryptionService.decryptMessage(msg.content, !isFromMe)
      }
    } catch {
      msg.content = '[Decryption failed]'
    }

    const isActive =
      navigationState.view === View.Private && navigationState.selectedUser?.id === otherUserId

    if (isFromMe && messageSenderService.replaceOptimisticIfPresent(msg)) {
      if (document.hasFocus() && isActive) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await messageLoaderService.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isActive && document.hasFocus()) {
      await messageLoaderService.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      notificationService.notifyIncomingMessage(msg)
    }
  }

  private handleIncomingGroupMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const conv = conversationsState.byId.get(msg.conversationId) as GroupConversation | undefined

    if (conv?.encrypted && sessionState.currentUser) {
      try {
        msg.content = await encryptionService.decryptGroupMessage(
          msg.content,
          sessionState.currentUser.id
        )
      } catch {
        msg.content = '[Decryption failed]'
      }
    }

    const isActive =
      navigationState.view === View.Private &&
      navigationState.selectedGroupConversation?.id === msg.conversationId

    if (isFromMe && messageSenderService.replaceOptimisticIfPresent(msg)) {
      if (document.hasFocus() && isActive) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await messageLoaderService.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isActive && document.hasFocus()) {
      await messageLoaderService.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      notificationService.notifyIncomingMessage(msg)
    }
  }
}

export const messageRouter = new MessageRouter()
