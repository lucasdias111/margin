interface BaseConversation {
  id: number
  createdAt: string
}

export type ConversationInviteStatus = 'ACCEPTED' | 'PENDING' | 'DECLINED'

export interface DirectConversation extends BaseConversation {
  type: 'DIRECT'
  otherUserId: number
  otherUserReadAt: string
  inviteStatus: ConversationInviteStatus
}

export interface GroupConversation extends BaseConversation {
  type: 'GROUP'
  name: string
  memberIds: number[]
}

export interface ChannelConversation extends BaseConversation {
  type: 'CHANNEL'
  channelId: number
  name: string
}

export type Conversation = DirectConversation | GroupConversation | ChannelConversation

export function isDirectConversation(conv: Conversation): conv is DirectConversation {
  return conv.type === 'DIRECT'
}

export function isGroupConversation(conv: Conversation): conv is GroupConversation {
  return conv.type === 'GROUP'
}

export function isChannelConversation(conv: Conversation): conv is ChannelConversation {
  return conv.type === 'CHANNEL'
}
