import type { DirectMessage } from "$src/interfaces/Messages";
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
        try {
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

            if (!currentUser) return;

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
        } catch (error) {
            console.error("Failed to send message:", error);
            return null;
        }
    }
}

export const chatService = new ChatService();