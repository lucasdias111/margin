import type { DirectMessage, SpaceMessage } from "$src/interfaces/Messages";
import type { User } from "$src/interfaces/User";
import { authenticatedFetch } from "./api";
import { encryptionService } from "./EncryptionService";
import { webSocketService } from "./WebSocketService";
import { WebSocketMessageType } from "$src/interfaces/WebSocketMessageType";

class ChatService {
    async getSpaces() {
        const response = await authenticatedFetch(
            `users/me`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
    }

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

    sendSpaceMessage(currentUser: User, recepientSpaceId: number, messageText: string) {
        webSocketService.send({
            type: WebSocketMessageType.SEND_SPACE_MESSAGE,
            toSpaceId: recepientSpaceId,
            message: messageText,
        });

        const newMessage: SpaceMessage = {
            id: null,
            fromUserId: currentUser.id,
            toSpaceId: recepientSpaceId,
            message: messageText,
            isEdited: false,
            createdAt: new Date(),
        };

        return newMessage;
    }
}

export const chatService = new ChatService();