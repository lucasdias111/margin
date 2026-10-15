package org.margin.server.websocket.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WebSocketMessage<T> {
	private WebSocketMessageType type;
	private Long timestamp;
	private Long recipientId;
	private T payload;
}
