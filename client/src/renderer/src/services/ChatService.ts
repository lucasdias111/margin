import type { DirectMessage, ChannelMessage } from "$src/interfaces/Messages";
import type { User } from "$src/interfaces/User";
import { encryptionService } from "./EncryptionService";
import { webSocketService } from "./WebSocketService";
import { WebSocketMessageType } from "$src/interfaces/WebSocketMessageType";

class ChatService {
    async sendDirectMessage(currentUser: User, toUserId: number, messageText: string) {
        const recipientPublicKey = await encryptionService.getPublicKey(toUserId);
        const myPublicKey = await encryptionService.getPublicKey(currentUser.id);

        const encryptedMessage = await encryptionService.encryptMessage(
            messageText,
            recipientPublicKey,
            myPublicKey
        );

        webSocketService.send({
            type: WebSocketMessageType.SEND_DIRECT_MESSAGE,
            toUserId: toUserId,
            message: encryptedMessage,
        });

        if (!currentUser) return null;

        const newMessage: DirectMessage = {
            id: null,
            fromUserId: currentUser.id,
            toUserId: toUserId,
            message: encryptedMessage,
            isRead: false,
            isEdited: false,
            createdAt: new Date(),
        };

        return newMessage;
    }

    async sendChannelMessage(currentUser: User, recepientChannelId: number, messageText: string) {
        webSocketService.send({
            type: WebSocketMessageType.SEND_CHANNEL_MESSAGE,
            toChannelId: recepientChannelId,
            message: messageText,
        });

        const newMessage: ChannelMessage = {
            id: null,
            fromUserId: currentUser.id,
            channelId: recepientChannelId,
            message: messageText,
            isEdited: false,
            createdAt: new Date(),
        };

        return newMessage;
    }
}

export const chatService = new ChatService();