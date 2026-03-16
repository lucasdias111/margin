package org.margin.server.websocket.processors;

import lombok.extern.slf4j.Slf4j;
import org.margin.server.social.calls.models.Call;
import org.margin.server.social.calls.services.CallService;
import org.margin.server.social.calls.services.CallValidationService;
import org.margin.server.users.models.User;
import org.margin.server.websocket.models.WebSocketMessageIn;
import org.margin.server.websocket.models.WebSocketMessageType;
import org.margin.server.websocket.models.payloads.IncomingCallEndPayload;
import org.margin.server.websocket.services.WebSocketDeliveryService;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CallEndProcessor implements WebSocketMessageProcessor<IncomingCallEndPayload> {

    private final CallService callService;
    private final WebSocketDeliveryService webSocketDeliveryService;
    private final CallValidationService callValidationService;

    public CallEndProcessor(CallService callService,
                            WebSocketDeliveryService webSocketDeliveryService, CallValidationService callValidationService) {
        this.callService = callService;
        this.webSocketDeliveryService = webSocketDeliveryService;
        this.callValidationService = callValidationService;
    }

    @Override
    public WebSocketMessageType getType() {
        return WebSocketMessageType.CALL_END;
    }

    @Override
    public void process(User user, WebSocketMessageIn<IncomingCallEndPayload> message) {
        IncomingCallEndPayload payload = message.getPayload();
        Call call = callService.getById(payload.callId());
        callValidationService.validateUserIsInCall(call, user);
        callService.endCall(call, payload.callDuration());
        webSocketDeliveryService.notifyCallEnd(message.getRecipientId());
    }
}