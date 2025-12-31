export interface BaseMessage {
    id: number | null;
    message: string;
    fromUserId: number;
    createdAt: Date;
}

export interface DirectMessage extends BaseMessage{
    toUserId: number;
    isRead: boolean;
    isEdited: boolean;
}

export interface SpaceMessage extends BaseMessage {
    toSpaceId: number;
    isEdited: boolean;
}