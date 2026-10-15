import type { User } from '$src/interfaces/User'

export interface Channel {
  id: number
  conversationId: number
  name: string
  description: string
  spaceId: number
  channelType: string
  voiceParticipants?: User[]
}

export function isThreadChannel(channel: Channel | null | undefined): boolean {
  return channel?.channelType === ChannelType.THREAD
}

export interface CreateChannel {
  name: string
  description: string
  spaceId: number
  channelType: ChannelType
}

export enum ChannelType {
  COMMUNICATION = 'Communication',
  ANNOUNCEMENT = 'Announcement',
  THREAD = 'Thread'
}
