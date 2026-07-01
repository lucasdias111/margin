import type { Message } from '$src/interfaces/Messages'
import type { User } from '$src/interfaces/User'
import {
  type Conversation,
  type DirectConversation,
  type GroupConversation,
  isDirectConversation
} from '$src/interfaces/Conversation'
import type { Channel } from '$src/interfaces/Channel'
import { encryptionService } from './EncryptionService'
import { webSocketService } from './WebSocketService'
import { WebSocketMessageType } from '$src/interfaces/WebSocketMessageType'
import { authenticatedGet, authenticatedPost } from '$src/services/api'
import { fileStorageService } from '$src/services/FileStorageService'
import { sessionState } from '$src/states/SessionState.svelte'
import { conversationsState, defaultMeta } from '$src/states/ConversationsState.svelte.js'
import { connectionState } from '$src/states/ConnectionState.svelte'
import { errorService } from '$src/services/ErrorService'

class MessageSenderService {
  private optimisticIdSeq = -1
  private pendingRetries = new Map<number, () => Promise<void>>()

  replaceOptimisticIfPresent(msg: Message): boolean {
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

export const messageSenderService = new MessageSenderService()
