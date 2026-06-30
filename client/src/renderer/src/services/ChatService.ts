import type {
  ConversationMessagesResponse,
  Message,
  MessageReaction
} from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import {
  type Conversation,
  type DirectConversation,
  type GroupConversation,
  isChannelConversation,
  isDirectConversation,
  isGroupConversation
} from '$src/interfaces/Conversation'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import type { Channel } from '$src/interfaces/Channel'
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '$src/services/api'
import { fileStorageService } from '$src/services/FileStorageService'
import { notificationService } from '$src/services/NotificationService'
import type { WebSocketMessage } from '$src/interfaces/WebSocketMessages'
import { View } from '$src/interfaces/View'
import { navigationState } from '$src/states/NavigationState.svelte'
import { navigationService } from '$src/services/NavigationService'
import { channelService } from '$src/services/ChannelService'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { conversationInviteService, type PendingInvite } from '$src/states/UserListState.svelte'
import { usersState } from '$src/states/UsersState.svelte'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { errorService } from '$src/services/ErrorService'

class ChatService {
  private static readonly PAGE_SIZE = 30

  private optimisticIdSeq = -1
  private pendingRetries = new Map<number, () => Promise<void>>()

  handleIncomingMessage = async (data: WebSocketMessage<Message>): Promise<void> => {
    const msg = data.payload
    if (msg.conversationType === 'CHANNEL') {
      await this.handleIncomingChannelMessage(msg)
    } else if (msg.conversationType === 'GROUP') {
      await this.handleIncomingGroupMessage(msg)
    } else {
      await this.handleIncomingDirectMessage(msg)
    }
  }

  private handleIncomingChannelMessage = async (msg: Message): Promise<void> => {
    const isFromMe = msg.user.id === sessionState.currentUser?.id
    const isActive =
      navigationState.view === View.Margin &&
      msg.conversationId === navigationState.selectedChannel?.conversationId

    if (isFromMe && this.replaceOptimisticIfPresent(msg)) {
      if (isActive && document.hasFocus()) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isFromMe) return

    if (isActive && document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
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

    if (isFromMe && this.replaceOptimisticIfPresent(msg)) {
      if (document.hasFocus() && isActive) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isActive && document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
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

    if (isFromMe && this.replaceOptimisticIfPresent(msg)) {
      if (document.hasFocus() && isActive) {
        const meta = conversationsState.conversationMetaById.get(msg.conversationId)
        if (meta?.unread) await this.markConversationAsRead(msg.conversationId)
      }
      return
    }

    conversationsState.appendMessage(msg, !isFromMe)

    if (isActive && document.hasFocus()) {
      await this.markConversationAsRead(msg.conversationId)
    } else {
      conversationsState.markUnread(msg.conversationId)
      notificationService.notifyIncomingMessage(msg)
    }
  }

  private replaceOptimisticIfPresent(msg: Message): boolean {
    const messages = conversationsState.messagesByConversationId.get(msg.conversationId) ?? []
    const optimisticIndices = messages.flatMap((m, i) => (m.id < 0 ? [i] : []))
    if (optimisticIndices.length === 0) return false

    const optimisticIndex =
      optimisticIndices.find((i) => messages[i].content === msg.content) ?? optimisticIndices[0]

    revokePreviewUrls(messages[optimisticIndex])
    this.pendingRetries.delete(messages[optimisticIndex].id)

    const updated = [...messages]
    updated[optimisticIndex] = msg
    conversationsState.messagesByConversationId.set(msg.conversationId, updated)
    const meta = conversationsState.conversationMetaById.get(msg.conversationId) ?? defaultMeta()
    conversationsState.conversationMetaById.set(msg.conversationId, {
      ...meta,
      lastMessage: msg.content,
      lastMessageTime: msg.createdAt,
      lastMessageIncoming: false
    })

    return true
  }

  async loadConversationForUser(user: User, force = false): Promise<void> {
    if (!force) {
      for (const [convId, conv] of conversationsState.byId) {
        if (conv.type === 'DIRECT' && conv.otherUserId === user.id) {
          const meta = conversationsState.conversationMetaById.get(convId)
          if (meta?.initialFetchCompleted && !meta?.isLoading) {
            if (document.hasFocus()) await this.markConversationAsRead(convId)
            return
          }
          break
        }
      }
    }

    await this.loadMessages(
      `conversations/${user.id}/direct_messages?limit=${ChatService.PAGE_SIZE}`,
      (conv) => (document.hasFocus() ? this.markConversationAsRead(conv.id) : Promise.resolve())
    )
  }

  async loadConversationForGroup(group: GroupConversation, force = false): Promise<void> {
    const meta = conversationsState.conversationMetaById.get(group.id)
    if (!force && meta?.initialFetchCompleted && !meta?.isLoading) {
      if (document.hasFocus()) await this.markConversationAsRead(group.id)
      return
    }

    await this.loadGroupMessages(group)
  }

  private async loadGroupMessages(group: GroupConversation): Promise<void> {
    const url = `conversations/${group.id}/messages?limit=${ChatService.PAGE_SIZE}`
    const response = await authenticatedGet(url)
    if (!response.ok) return

    const messageResponse: ConversationMessagesResponse = await response.json()
    const conv = messageResponse.conversation
    if (!conv) return

    conversationsState.byId.set(conv.id, conv)
    conversationsState.conversationMetaById.set(conv.id, {
      ...(conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()),
      isLoading: true
    })

    let messages = messageResponse.messages
    if (group.encrypted && sessionState.currentUser) {
      messages = await Promise.all(
        messages.map(async (msg) => {
          try {
            msg.content = await encryptionService.decryptGroupMessage(
              msg.content,
              sessionState.currentUser!.id
            )
          } catch {
            msg.content = '[Decryption failed]'
          }
          return msg
        })
      )
    }

    conversationsState.messagesByConversationId.set(conv.id, messages)
    conversationsState.conversationMetaById.set(conv.id, {
      ...(conversationsState.conversationMetaById.get(conv.id) ?? defaultMeta()),
      isLoading: false,
      hasMore: messages.length >= ChatService.PAGE_SIZE,
      lastMessage: messages[messages.length - 1]?.content ?? null,
      initialFetchCompleted: true
    })

    if (document.hasFocus()) await this.markConversationAsRead(conv.id)
  }

  async loadConversationForChannel(channel: Channel, force = false): Promise<void> {
    const conversationId = channel.conversationId
    if (!force) {
      const meta = conversationsState.conversationMetaById.get(conversationId)
      if (meta?.initialFetchCompleted && !meta?.isLoading) {
        if (document.hasFocus()) await this.markConversationAsRead(conversationId)
        return
      }
    }

    await this.loadMessages(
      `conversations/${channel.id}/channel_messages?limit=${ChatService.PAGE_SIZE}`,
      () => (document.hasFocus() ? this.markConversationAsRead(conversationId) : Promise.resolve())
    )
  }

  private async loadMessages(
    url: string,
    onLoaded: (conv: Conversation) => Promise<void>
  ): Promise<void> {
    const response = await authenticatedGet(url)
    if (!response.ok) return

    const messageResponse: ConversationMessagesResponse = await response.json()
    const conv = messageResponse.conversation
    if (!conv) return

    const convId = conv.id

    conversationsState.byId.set(convId, conv)

    conversationsState.conversationMetaById.set(convId, {
      ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
      isLoading: true
    })

    let decryptedMessages: Message[] = []
    try {
      decryptedMessages = await this.decryptIfDirect(messageResponse.messages, conv)
    } catch (error) {
      console.error('Error loading messages:', error)
    }

    conversationsState.messagesByConversationId.set(convId, decryptedMessages)
    conversationsState.conversationMetaById.set(convId, {
      ...(conversationsState.conversationMetaById.get(convId) ?? defaultMeta()),
      isLoading: false,
      hasMore: messageResponse.messages.length >= ChatService.PAGE_SIZE,
      lastMessage: decryptedMessages[decryptedMessages.length - 1]?.content ?? null,
      initialFetchCompleted: true
    })

    await onLoaded(conv)
  }

  async fetchMessagesBefore(
    conv: Conversation,
    beforeId: number
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const url = this.buildPaginationUrl(conv, beforeId)
    if (!url) return { messages: [], hasMore: false }

    try {
      const response = await authenticatedGet(url)
      if (!response.ok) return { messages: [], hasMore: false }

      const messageResponse: ConversationMessagesResponse = await response.json()
      let messages = messageResponse.messages

      if (isGroupConversation(conv) && conv.encrypted && sessionState.currentUser) {
        messages = await Promise.all(
          messages.map(async (msg) => {
            try {
              msg.content = await encryptionService.decryptGroupMessage(
                msg.content,
                sessionState.currentUser!.id
              )
            } catch {
              msg.content = '[Decryption failed]'
            }
            return msg
          })
        )
      } else {
        messages = await this.decryptIfDirect(messages, conv)
      }

      const hasMore = messages.length === ChatService.PAGE_SIZE
      return { messages, hasMore }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { messages: [], hasMore: false }
    }
  }

  private buildPaginationUrl(conversation: Conversation, before: number): string | null {
    if (isDirectConversation(conversation)) {
      return `conversations/${conversation.otherUserId}/direct_messages?limit=${ChatService.PAGE_SIZE}&before=${before}`
    }
    if (isGroupConversation(conversation)) {
      return `conversations/${conversation.id}/messages?limit=${ChatService.PAGE_SIZE}&before=${before}`
    }
    if (isChannelConversation(conversation)) {
      return `conversations/${conversation.channelId}/channel_messages?limit=${ChatService.PAGE_SIZE}&before=${before}`
    }
    return null
  }

  private async decryptIfDirect(
    messages: Message[],
    conversation: Conversation
  ): Promise<Message[]> {
    if (!isDirectConversation(conversation) || !conversation.encrypted) return messages

    return Promise.all(
      messages.map(async (message) => {
        try {
          const isRecipient = message.user.id !== sessionState.currentUser.id
          message.content = await encryptionService.decryptMessage(message.content, isRecipient)
          return message
        } catch {
          message.content = '[Decryption failed]'
          return message
        }
      })
    )
  }

  async sendMessageAndStartConversation(
    currentUser: User,
    toUserId: number,
    messageText: string,
    encrypted = false
  ): Promise<{ conversation: Conversation; message: Message }> {
    let content = messageText
    if (encrypted) {
      content = await this.encryptForUser(messageText, toUserId, currentUser.id)
    }
    const response = await authenticatedPost(
      { recipientUserId: toUserId, encryptedContent: content, encrypted },
      'conversations/create_private'
    )
    const conversation: Conversation = await response.json()
    const message = this.buildOptimisticMessage(currentUser, conversation.id, messageText, 'DIRECT')

    return { conversation, message }
  }

  async sendMessage(
    currentUser: User,
    conversation: Conversation,
    messageText: string
  ): Promise<Message | null> {
    if (!this.guardConnected()) return null
    let content = messageText
    if (isDirectConversation(conversation) && conversation.encrypted) {
      content = await this.encryptForUser(messageText, conversation.otherUserId, currentUser.id)
    }
    webSocketService.send<{ content: string; attachmentIds: number[] }>({
      type: WebSocketMessageType.SEND_MESSAGE,
      recipientId: conversation.id,
      payload: { content, attachmentIds: [] }
    })
    return this.buildOptimisticMessage(currentUser, conversation.id, messageText, 'DIRECT')
  }

  async sendDirectMessage(
    currentUser: User,
    conversation: DirectConversation,
    messageText: string,
    inlineFiles: File[] = []
  ): Promise<Message | null> {
    if (!this.guardConnected()) return null
    const optimistic = this.buildOptimisticMessage(
      currentUser,
      conversation.id,
      messageText,
      'DIRECT',
      inlineFiles
    )
    conversationsState.appendMessage(optimistic, false)
    await this.dispatch(
      optimistic,
      () => this.uploadConversationAttachments(conversation.id, inlineFiles),
      async (attachmentIds) => {
        let content = messageText
        if (conversation.encrypted) {
          content = await this.encryptForUser(messageText, conversation.otherUserId, currentUser.id)
        }
        return { recipientId: conversation.id, content, attachmentIds }
      }
    )
    return optimistic
  }

  async sendGroupMessage(
    currentUser: User,
    conversation: GroupConversation,
    messageText: string,
    inlineFiles: File[] = []
  ): Promise<Message | null> {
    if (!this.guardConnected()) return null
    const optimistic = this.buildOptimisticMessage(
      currentUser,
      conversation.id,
      messageText,
      'GROUP',
      inlineFiles
    )
    conversationsState.appendMessage(optimistic, false)
    await this.dispatch(
      optimistic,
      () => this.uploadConversationAttachments(conversation.id, inlineFiles),
      async (attachmentIds) => {
        let content = messageText
        if (conversation.encrypted) {
          const memberKeys = await this.fetchGroupMemberKeys(conversation.id)
          content = await encryptionService.encryptMessageForGroup(messageText, memberKeys)
        }
        return { recipientId: conversation.id, content, attachmentIds }
      }
    )
    return optimistic
  }

  private async fetchGroupMemberKeys(conversationId: number): Promise<Record<string, string>> {
    const response = await authenticatedGet(`conversations/${conversationId}/member-public-keys`)
    if (!response.ok) throw new Error('Failed to fetch group member keys')
    const data: Record<number, string> = await response.json()
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [String(k), v]))
  }

  private async uploadConversationAttachments(
    conversationId: number,
    files: File[]
  ): Promise<number[]> {
    if (!files.length) return []
    const uploaded = await Promise.all(
      files.map((f) => fileStorageService.uploadConversationFile(conversationId, f))
    )
    if (uploaded.some((f) => f === null)) throw new Error('Attachment upload failed')
    return uploaded.map((f) => f!.fileId)
  }

  async sendChannelMessage(
    currentUser: User,
    channel: Channel,
    messageText: string,
    attachments: File[] = [],
    inlineAttachments: File[] = []
  ): Promise<Message | null> {
    if (!this.guardConnected()) return null
    const optimistic = this.buildOptimisticMessage(
      currentUser,
      channel.conversationId,
      messageText,
      'CHANNEL',
      [...inlineAttachments, ...attachments]
    )
    conversationsState.appendMessage(optimistic, false)
    await this.dispatch(
      optimistic,
      async () => {
        const [fileIds, inlineIds] = await Promise.all([
          this.uploadChannelAttachments(channel.id, attachments, false),
          this.uploadChannelAttachments(channel.id, inlineAttachments, true)
        ])
        return [...inlineIds, ...fileIds]
      },
      async (attachmentIds) => ({
        recipientId: channel.conversationId,
        content: messageText,
        attachmentIds
      })
    )
    return optimistic
  }

  private async dispatch(
    optimistic: Message,
    uploadAttachments: () => Promise<number[]>,
    buildFrame: (
      attachmentIds: number[]
    ) => Promise<{ recipientId: number; content: string; attachmentIds: number[] }>
  ): Promise<void> {
    const convId = optimistic.conversationId
    try {
      const attachmentIds = await uploadAttachments()
      const { recipientId, content } = await buildFrame(attachmentIds)
      webSocketService.send<{ content: string; attachmentIds: number[] }>({
        type: WebSocketMessageType.SEND_MESSAGE,
        recipientId,
        payload: { content, attachmentIds }
      })
      this.pendingRetries.delete(optimistic.id)
    } catch (error) {
      console.error('Failed to send message:', error)
      conversationsState.setMessageStatus(convId, optimistic.id, 'error')
      this.pendingRetries.set(optimistic.id, () =>
        this.dispatch(optimistic, uploadAttachments, buildFrame)
      )
    }
  }

  async retryMessage(message: Message): Promise<void> {
    const retry = this.pendingRetries.get(message.id)
    if (!retry) return
    if (!this.guardConnected()) return
    conversationsState.setMessageStatus(message.conversationId, message.id, 'sending')
    await retry()
  }

  private async uploadChannelAttachments(
    channelId: number,
    files: File[],
    inline: boolean
  ): Promise<number[]> {
    if (!files.length) return []
    const uploaded = await Promise.all(
      files.map((f) => fileStorageService.uploadChannelFile(channelId, f, inline))
    )
    if (uploaded.some((f) => f === null)) throw new Error('Attachment upload failed')
    return uploaded.map((f) => f!.fileId)
  }

  private guardConnected(): boolean {
    if (connectionState.connectionStatus === 'connected') return true
    errorService.reportError('Not connected — message not sent')
    return false
  }

  private async encryptForUser(
    text: string,
    recipientId: number,
    senderId: number
  ): Promise<string> {
    const recipientPublicKey = await encryptionService.getPublicKey(recipientId)
    const myPublicKey = await encryptionService.getPublicKey(senderId)
    return encryptionService.encryptMessage(text, recipientPublicKey, myPublicKey)
  }

  private buildOptimisticMessage(
    user: User,
    conversationId: number | null,
    content: string,
    conversationType: 'DIRECT' | 'CHANNEL' | 'GROUP',
    files: File[] = []
  ): Message {
    return {
      id: this.optimisticIdSeq--,
      conversationId,
      user,
      content,
      conversationType,
      isEdited: false,
      createdAt: new Date().toISOString(),
      reactions: [],
      attachments: [],
      status: 'sending',
      localAttachments: files.map((file) => ({
        fileName: file.name,
        contentType: file.type,
        previewUrl: createPreviewUrl(file)
      }))
    }
  }

  async deleteMessage(message: Message): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_DELETE_MESSAGE,
      recipientId: message.conversationId,
      payload: message.id.toString()
    })
    conversationsState.deleteMessage(message)
  }

  async editMessagePrivateMessage(
    message: Message,
    newContent: string,
    toUserId: number
  ): Promise<void> {
    if (!sessionState.currentUser) return
    const encrypted = await this.encryptForUser(newContent, toUserId, sessionState.currentUser.id)
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: { messageId: message.id, content: encrypted }
    })
  }

  async editChannelMessage(message: Message, newContent: string): Promise<void> {
    webSocketService.send({
      type: WebSocketMessageType.SEND_EDIT_MESSAGE,
      recipientId: message.conversationId,
      payload: { messageId: message.id, content: newContent }
    })
  }

  addReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_ADD_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  removeReaction(message: Message, emoji: string): void {
    webSocketService.send({
      type: WebSocketMessageType.SEND_REMOVE_REACTION,
      recipientId: message.conversationId,
      payload: { messageId: message.id, emoji }
    })
  }

  handleIncomingReactionAdded = (reaction: MessageReaction): void => {
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }

    const already = updatedMessage.reactions.some(
      (r) => r.userId === reaction.userId && r.emoji === reaction.emoji
    )

    if (!already) {
      updatedMessage.reactions = [...updatedMessage.reactions, reaction]
      const updatedMessages = [...messages]
      updatedMessages[index] = updatedMessage
      conversationsState.messagesByConversationId.set(convId, updatedMessages)
    }
  }

  handleIncomingReactionRemoved = (reaction: MessageReaction): void => {
    const convId = conversationsState.currentConversation.id
    const messages = conversationsState.messagesByConversationId.get(convId)
    if (!messages) return

    const index = messages.findIndex((m) => m.id === reaction.messageId)
    if (index === -1) return

    const updatedMessage = { ...messages[index] }
    updatedMessage.reactions = updatedMessage.reactions.filter(
      (r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
    )

    const updatedMessages = [...messages]
    updatedMessages[index] = updatedMessage
    conversationsState.messagesByConversationId.set(convId, updatedMessages)
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    if (!conversationId) return
    conversationsState.markRead(conversationId, new Date().toISOString())
    notificationService.dismissNotificationsForConversation(conversationId)
    try {
      await authenticatedPost(null, `conversations/${conversationId}/read`)
    } catch (error) {
      console.error('Failed to mark conversation as read:', error)
    }
  }

  handleIncomingConversationInvite = (data: WebSocketMessage<PendingInvite>): void => {
    conversationInviteService.addPendingInvite(data.payload)
  }

  handleConversationInviteAccepted = (
    data: WebSocketMessage<{ conversation: DirectConversation; acceptedBy: User }>
  ): void => {
    const { conversation, acceptedBy } = data.payload

    usersState.add(acceptedBy)

    const accepted: DirectConversation = {
      ...conversation,
      otherUserId: acceptedBy.id,
      inviteStatus: 'ACCEPTED'
    }
    conversationsState.byId.set(accepted.id, accepted)

    if (!conversationsState.conversationMetaById.has(accepted.id)) {
      conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
    }
  }

  async sendConversationInvite(email: string, encrypted = false): Promise<void> {
    await authenticatedPost({ email, encrypted }, 'conversations/invite')
  }

  async createGroupConversation(
    memberEmails: string[],
    name: string,
    encrypted = false
  ): Promise<GroupConversation> {
    const response = await authenticatedPost(
      { memberEmails, name, encrypted },
      'conversations/group'
    )
    if (!response.ok) throw new Error('Failed to create group conversation')
    const group: GroupConversation = await response.json()
    conversationsState.byId.set(group.id, group)
    if (!conversationsState.conversationMetaById.has(group.id)) {
      conversationsState.conversationMetaById.set(group.id, defaultMeta())
    }
    return group
  }

  async acceptConversationInvite(invite: PendingInvite): Promise<void> {
    await authenticatedPost(null, `conversations/${invite.conversation.id}/invite/accept`)
    conversationInviteService.removePendingInvite(invite.conversation.id)

    if (invite.conversation.type === 'DIRECT') {
      usersState.add(invite.fromUser)
      const accepted: DirectConversation = {
        ...invite.conversation,
        otherUserId: invite.fromUser.id,
        inviteStatus: 'ACCEPTED'
      }
      conversationsState.byId.set(accepted.id, accepted)
      if (!conversationsState.conversationMetaById.has(accepted.id)) {
        conversationsState.conversationMetaById.set(accepted.id, defaultMeta())
      }
    } else if (invite.conversation.type === 'GROUP') {
      const group = invite.conversation as GroupConversation
      conversationsState.byId.set(group.id, group)
      if (!conversationsState.conversationMetaById.has(group.id)) {
        conversationsState.conversationMetaById.set(group.id, defaultMeta())
      }
    }
  }

  async declineConversationInvite(conversationId: number): Promise<void> {
    await authenticatedPost(null, `conversations/${conversationId}/invite/decline`)
    conversationInviteService.removePendingInvite(conversationId)
  }

  async loadPendingInvites(): Promise<void> {
    try {
      const response = await authenticatedGet('conversations/pending_invites')
      if (!response.ok) return
      const invites: PendingInvite[] = await response.json()
      invites.forEach((invite) => conversationInviteService.addPendingInvite(invite))
    } catch (error) {
      console.error('Failed to load pending invites:', error)
    }
  }

  selectContent(content: View): void {
    if (navigationState.view !== content) {
      navigationState.selectedUser = null
      navigationState.selectedGroupConversation = null
    }
    navigationService.setView(content)
    channelService.select(null)
  }

  setConversationReadAt(conversationId: number, readAt: string): void {
    const conv = conversationsState.byId.get(conversationId)
    if (!conv) return
    if (conv.type === 'DIRECT') {
      conversationsState.byId.set(conversationId, {
        ...conv,
        otherUserReadAt: readAt
      })
    }

    const meta = conversationsState.conversationMetaById.get(conversationId)
    if (meta) {
      conversationsState.conversationMetaById.set(conversationId, {
        ...meta,
        lastReadAt: readAt,
        unread: false
      })
    }
  }

  selectGroupConversation(group: GroupConversation): void {
    navigationState.selectedUser = null
    navigationState.selectedGroupConversation = group
    navigationService.setView(View.Private)
    channelService.select(null)
    this.loadConversationForGroup(group)
  }

  async addGroupMember(conversationId: number, userId: number): Promise<void> {
    const response = await authenticatedPost({ userId }, `conversations/${conversationId}/members`)
    if (!response.ok) throw new Error('Failed to add member')
    const conv = conversationsState.byId.get(conversationId)
    if (conv && conv.type === 'GROUP') {
      conversationsState.byId.set(conversationId, {
        ...conv,
        memberIds: [...conv.memberIds, userId]
      })
    }
  }

  async leaveGroup(conversationId: number): Promise<void> {
    const userId = sessionState.currentUser?.id
    if (!userId) return
    const response = await authenticatedDelete(
      null,
      `conversations/${conversationId}/members/${userId}`
    )
    if (!response.ok) throw new Error('Failed to leave group')
    conversationsState.byId.delete(conversationId)
    conversationsState.messagesByConversationId.delete(conversationId)
    conversationsState.conversationMetaById.delete(conversationId)
    navigationState.selectedGroupConversation = null
  }
}

function createPreviewUrl(file: File): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return ''
  return URL.createObjectURL(file)
}

function revokePreviewUrls(message: Message): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') return
  for (const att of message.localAttachments ?? []) {
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)
  }
}

export const chatService = new ChatService()
