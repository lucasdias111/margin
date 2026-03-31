export interface UnreadConversations {
  directConversationIds: number[]
  channelUnreads: { conversationId: number; marginId: number }[]
}
