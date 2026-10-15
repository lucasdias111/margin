package org.margin.server.integrationtest;

import org.junit.jupiter.api.Test;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.MarginTestUtils;
import org.margin.server.integrationtest.utils.UserTestUtils;
import org.margin.server.meetings.models.dtos.MeetingSummaryDTO;
import org.margin.server.meetings.models.dtos.ScheduleMeetingRequest;
import org.margin.server.meetings.services.MeetingSchedulingService;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.users.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class OperatorToolsTest extends MarginTestRunner {

    private static final String INTERNAL_KEY = "integration-test-internal-api-key";

    @LocalServerPort
    private int port;

    @Autowired
    private MeetingSchedulingService schedulingService;

    private final HttpClient client = HttpClient.newHttpClient();

    private HttpResponse<String> resetLink(String email, String key) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(
                URI.create("http://127.0.0.1:" + port + "/api/internal/reset-link?email=" + email))
                .POST(HttpRequest.BodyPublishers.noBody());
        if (key != null) {
            request.header("X-Internal-Api-Key", key);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void theCliCanIssueAResetLinkWithTheInternalKey() throws Exception {
        UserTestUtils.createUser("locked", "locked@example.com");

        HttpResponse<String> response = resetLink("locked@example.com", INTERNAL_KEY);

        assertEquals(200, response.statusCode());
        assertTrue(response.body().startsWith("http://localhost:8080/reset-password/"));
    }

    @Test
    void theInternalEndpointRefusesCallersWithoutTheKey() throws Exception {
        UserTestUtils.createUser("locked", "locked@example.com");

        assertEquals(403, resetLink("locked@example.com", null).statusCode());
        assertEquals(403, resetLink("locked@example.com", "wrong").statusCode());
        assertEquals(404, resetLink("nobody@example.com", INTERNAL_KEY).statusCode());
    }

    @Test
    void theHostCanDownloadACalendarFileButOthersCannot() {
        User host = UserTestUtils.createUser("host", "host@example.com");
        User other = UserTestUtils.createUser("other", "other@example.com");
        Margin margin = MarginTestUtils.createMargin("Acme", host);
        MeetingSummaryDTO meeting = schedulingService.schedule(host.getId(), new ScheduleMeetingRequest(
                margin.getId(), "Planning", Instant.now().plus(2, ChronoUnit.HOURS), 30, null, null, null));

        String ics = schedulingService.calendarFile(meeting.code(), host.getId());

        assertTrue(ics.contains("BEGIN:VCALENDAR"));
        assertTrue(ics.contains("http://localhost:8080/meet/" + meeting.code()));
        assertThrows(ResponseStatusException.class, () -> schedulingService.calendarFile(meeting.code(), other.getId()));
    }
}
