export interface BaseMessage {
  id: number | null
  message: string
  fromUserId: number
  createdAt: Date
}

export interface DirectMessage extends BaseMessage {
  toUserId: number
  isRead: boolean
  isEdited: boolean
}

export interface ChannelMessage extends BaseMessage {
  fromUserId: number
  channelId: number
  isEdited: boolean
}
