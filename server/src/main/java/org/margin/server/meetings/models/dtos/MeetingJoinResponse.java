package org.margin.server.meetings.models.dtos;

public record MeetingJoinResponse(String sfuUrl,
                                  String roomId,
                                  String roomToken,
                                  String peerId,
                                  String displayName,
                                  String title) {
}
