package org.margin.server.integrationtest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.MarginTestUtils;
import org.margin.server.integrationtest.utils.UserTestUtils;
import org.margin.server.meetings.models.MeetingRole;
import org.margin.server.meetings.models.MeetingStatus;
import org.margin.server.meetings.models.dtos.CreateMeetingRequest;
import org.margin.server.meetings.models.dtos.EligibleMarginDTO;
import org.margin.server.meetings.models.dtos.MeetingDTO;
import org.margin.server.meetings.services.MeetingService;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.users.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class MeetingTest extends MarginTestRunner {

    @Autowired
    private MeetingService meetingService;

    private User host;
    private Margin margin;

    @BeforeEach
    void setUpMeetingFixtures() {
        host = UserTestUtils.createUser("alice", "alice@margin.chat");
        margin = MarginTestUtils.createMargin("Acme", host);
        // Meetings are a paid feature; margins start on FREE.
    }

    private MeetingDTO createMeeting() {
        return meetingService.createInstantMeeting(host.getId(),
                new CreateMeetingRequest(margin.getId(), "Standup", null));
    }

    @Test
    void createInstantMeeting_startsLiveWithTheHostAsParticipant() {
        MeetingDTO meeting = createMeeting();

        assertEquals(MeetingStatus.LIVE, meeting.status());
        assertNotNull(meeting.code());
        assertEquals("Standup", meeting.title());
        assertEquals(margin.getId(), meeting.marginId());
        assertEquals(host.getId(), meeting.hostUserId());
        assertTrue(meeting.requireAdmission(), "admission should default on for public links");

        assertEquals(1, meeting.participants().size());
        assertEquals(MeetingRole.HOST, meeting.participants().getFirst().role());
    }

    @Test
    void createInstantMeeting_snapshotsTheMarginsParticipantLimit() {
        MeetingDTO meeting = createMeeting();

        assertTrue(meeting.maxParticipants() > 0,
                "the room capacity is captured when the meeting is created");
    }

    @Test
    void createInstantMeeting_withoutAMarginIsRejected() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> meetingService.createInstantMeeting(host.getId(),
                        new CreateMeetingRequest(null, "Standup", null)));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
    }

    @Test
    void createInstantMeeting_inAMarginYouDoNotBelongToIsForbidden() {
        User outsider = UserTestUtils.createUser("mallory", "mallory@margin.chat");

        assertThrows(ResponseStatusException.class,
                () -> meetingService.createInstantMeeting(outsider.getId(),
                        new CreateMeetingRequest(margin.getId(), "Nope", null)));
    }

    @Test
    void getByCode_isVisibleToMarginMembersAndHiddenFromEveryoneElse() {
        MeetingDTO created = createMeeting();
        User member = UserTestUtils.createUser("bob", "bob@margin.chat");
        MarginTestUtils.addUserToMargin(margin.getId(), host, member);
        User outsider = UserTestUtils.createUser("mallory", "mallory@margin.chat");

        assertEquals(created.code(), meetingService.getByCode(created.code(), member.getId()).code());
        assertThrows(ResponseStatusException.class,
                () -> meetingService.getByCode(created.code(), outsider.getId()));
    }

    @Test
    void getByCode_unknownCodeIsNotFound() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> meetingService.getByCode("does-not-exist", host.getId()));

        assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
    }







    @Test
    void end_marksTheMeetingEnded() {
        MeetingDTO created = createMeeting();

        MeetingDTO ended = meetingService.end(created.code(), host.getId());

        assertEquals(MeetingStatus.ENDED, ended.status());
        assertNotNull(ended.endedAt());
    }

    @Test
    void end_byANonHostIsForbidden() {
        MeetingDTO created = createMeeting();
        User member = UserTestUtils.createUser("bob", "bob@margin.chat");
        MarginTestUtils.addUserToMargin(margin.getId(), host, member);

        ResponseStatusException e = assertThrows(ResponseStatusException.class,
                () -> meetingService.end(created.code(), member.getId()));

        assertEquals(HttpStatus.FORBIDDEN, e.getStatusCode());
    }

    @Test
    void meetingCodes_areUniquePerMeeting() {
        assertNotEquals(createMeeting().code(), createMeeting().code());
    }


    @Test
    void eligibleMargins_listsEveryMarginTheUserBelongsTo() {
        Margin second = MarginTestUtils.createMargin("Second", host);
        User outsiderHost = UserTestUtils.createUser("olivia", "olivia@margin.chat");
        Margin someoneElses = MarginTestUtils.createMargin("NotMine", outsiderHost);

        List<EligibleMarginDTO> eligible = meetingService.eligibleMargins(host.getId());

        List<Long> ids = eligible.stream().map(EligibleMarginDTO::marginId).toList();
        assertTrue(ids.containsAll(List.of(margin.getId(), second.getId())));
        assertTrue(ids.stream().noneMatch(id -> id.equals(someoneElses.getId())),
                "membership is still required");
    }


}
