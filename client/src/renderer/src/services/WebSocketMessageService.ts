import { webSocketService } from "$src/services/WebSocketService";
import { encryptionService } from "$src/services/EncryptionService";
import { chatState } from "$src/states/ChatState.svelte";
import type { DirectMessage } from "$src/interfaces/Messages";

type MessageCallback = (message: DirectMessage) => void;

class WebSocketMessageService {
    private messageCallbacks: Set<MessageCallback> = new Set();
    private isInitialized = false;

    initialize() {
        if (this.isInitialized) {
            console.warn("WebSocketMessageService already initialized");
            return;
        }

        webSocketService.on("SEND_MESSAGE", this.handleIncomingMessage.bind(this));
        this.isInitialized = true;
        console.log("WebSocketMessageService initialized");
    }

    destroy() {
        webSocketService.off("SEND_MESSAGE", this.handleIncomingMessage.bind(this));
        this.messageCallbacks.clear();
        this.isInitialized = false;
    }

    private async handleIncomingMessage(data: any) {
        try {
            console.log("Incoming message data:", data);
            const incomingMsg: DirectMessage = JSON.parse(data.payload);

            incomingMsg.message = await encryptionService.decryptMessage(
                incomingMsg.message,
                true
            );

            this.messageCallbacks.forEach(callback => {
                callback(incomingMsg);
            });

        } catch (error) {
            console.error("Error handling incoming message:", error, data);
        }
    }

    subscribe(callback: MessageCallback): () => void {
        this.messageCallbacks.add(callback);
        
        return () => {
            this.messageCallbacks.delete(callback);
        };
    }

    isMessageForSelectedUser(message: DirectMessage): boolean {
        return chatState.selectedUser?.id === message.fromUserId;
    }
}

export const wsMessageService = new WebSocketMessageService();