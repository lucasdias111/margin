export interface UnreadConversations {
  directConversationIds: number[]
  groupConversationIds: number[]
  channelUnreads: { conversationId: number; marginId: number }[]
}
