export interface Channel {
  id: number
  conversationId: number
  name: string
  description: string
  spaceId: number
  type: string
}

export interface CreateChannel {
  name: string
  description: string
  spaceId: number
  channelType: ChannelType
}

export enum ChannelType {
  COMMUNICATION = 'Communication',
  ANNOUNCEMENT = 'Announcement'
}
