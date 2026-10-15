import type { User } from '$src/interfaces/User'
import type { Channel } from '$src/interfaces/Channel'
import type { Space } from '$src/interfaces/Space'
import type { Message, MessageReaction } from '$src/interfaces/Messages'
import type {
  ChannelConversation,
  DirectConversation,
  GroupConversation,
  ThreadConversation
} from '$src/interfaces/Conversation'
import type { RecentChatUser } from '$src/interfaces/RecentChatUser'
import type { SFUParticipant } from '$src/interfaces/Calls'

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    displayName: 'Lucas',
    email: 'lucas@margin.chat',
    createdAt: '2025-01-01T00:00:00Z',
    profilePictureUrl: null,
    lastSeenAt: null,
    isOnline: true,
    ...overrides
  }
}

export function buildChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: 5,
    conversationId: 20,
    name: 'general',
    description: 'General channel',
    spaceId: 1,
    type: 'Communication',
    voiceParticipants: [],
    ...overrides
  }
}

export function buildSpace(overrides: Partial<Space> = {}): Space {
  return {
    spaceId: 1,
    spaceName: 'Test Space',
    spaceDescription: '',
    visibility: 'PUBLIC',
    marginId: 1,
    channels: [],
    members: [],
    ...overrides
  }
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 100,
    conversationId: 10,
    user: buildUser(),
    content: 'encrypted-content',
    conversationType: 'DIRECT',
    isEdited: false,
    createdAt: '2025-06-01T12:00:00Z',
    reactions: [],
    attachments: [],
    ...overrides
  }
}

export function buildReaction(overrides: Partial<MessageReaction> = {}): MessageReaction {
  return {
    id: 1,
    messageId: 100,
    conversationId: 10,
    userId: 2,
    displayName: 'Other User',
    emoji: '👍',
    ...overrides
  }
}

export function buildDirectConversation(
  overrides: Partial<DirectConversation> = {}
): DirectConversation {
  return {
    id: 10,
    type: 'DIRECT',
    otherUserId: 2,
    otherUserReadAt: '2025-01-01T00:00:00Z',
    inviteStatus: 'ACCEPTED',
    createdAt: '2025-06-01T12:00:00Z',
    encrypted: false,
    ...overrides
  }
}

export function buildGroupConversation(
  overrides: Partial<GroupConversation> = {}
): GroupConversation {
  return {
    id: 30,
    type: 'GROUP',
    name: 'Test Group',
    memberIds: [1, 2, 3],
    createdAt: '2025-06-01T12:00:00Z',
    encrypted: false,
    ...overrides
  }
}

export function buildChannelConversation(
  overrides: Partial<ChannelConversation> = {}
): ChannelConversation {
  return {
    id: 20,
    type: 'CHANNEL',
    channelId: 5,
    name: 'general',
    createdAt: '2025-06-01T12:00:00Z',
    ...overrides
  }
}

export function buildThreadConversation(
  overrides: Partial<ThreadConversation> = {}
): ThreadConversation {
  return {
    id: 40,
    type: 'THREAD',
    parentConversationId: 20,
    channelId: 5,
    marginId: 1,
    title: 'A post',
    following: false,
    createdAt: '2025-06-01T12:00:00Z',
    ...overrides
  }
}

export function buildRecentChatUser(overrides: Partial<RecentChatUser> = {}): RecentChatUser {
  return {
    conversation: buildDirectConversation(),
    user: buildUser(),
    lastMessage: 'last',
    lastMessageTime: '2025-06-01T00:00:00Z',
    lastMessageIncoming: true,
    ...overrides
  }
}

export function buildParticipant(overrides: Partial<SFUParticipant> = {}): SFUParticipant {
  return {
    peerId: 'peer-1',
    displayName: 'Peer',
    profilePictureUrl: null,
    audioStream: null,
    videoStream: null,
    screenStream: null,
    isVideoEnabled: false,
    isScreenSharing: false,
    ...overrides
  }
}
