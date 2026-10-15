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
  encrypted: boolean
}

export interface GroupConversation extends BaseConversation {
  type: 'GROUP'
  name: string
  memberIds: number[]
  pendingMemberIds: number[]
  encrypted: boolean
}

export interface ChannelConversation extends BaseConversation {
  type: 'CHANNEL'
  channelId: number
  name: string
}

export interface ThreadConversation extends BaseConversation {
  type: 'THREAD'
  parentConversationId: number
  channelId: number | null
  marginId: number | null
  title: string
  following: boolean
}

export type Conversation =
  | DirectConversation
  | GroupConversation
  | ChannelConversation
  | ThreadConversation

export function isDirectConversation(conv: Conversation): conv is DirectConversation {
  return conv.type === 'DIRECT'
}

export function isGroupConversation(conv: Conversation): conv is GroupConversation {
  return conv.type === 'GROUP'
}

export function isChannelConversation(conv: Conversation): conv is ChannelConversation {
  return conv.type === 'CHANNEL'
}

export function isThreadConversation(conv: Conversation): conv is ThreadConversation {
  return conv.type === 'THREAD'
}
