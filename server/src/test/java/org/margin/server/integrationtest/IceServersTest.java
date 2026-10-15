package org.margin.server.integrationtest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.margin.server.authentication.services.JwtService;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.AuthTestUtils;
import org.margin.server.integrationtest.utils.MarginTestUtils;
import org.margin.server.integrationtest.utils.UserTestUtils;
import org.margin.server.meetings.models.dtos.CreateMeetingRequest;
import org.margin.server.meetings.models.dtos.MeetingDTO;
import org.margin.server.meetings.services.MeetingGuestService;
import org.margin.server.meetings.services.MeetingService;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.users.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class IceServersTest extends MarginTestRunner {

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private MeetingService meetingService;

    @Autowired
    private MeetingGuestService guestService;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    private HttpResponse<String> get(String token) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/ice-servers")).GET();
        if (token != null) {
            request.header("Authorization", "Bearer " + token);
        }
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String userToken(User user) {
        return jwtService.generateToken(user.getEmail(), user.getId(), AuthTestUtils.securityOf(user).getTokenVersion());
    }

    @Test
    void signedInUsersGetStunAndShortLivedTurnCredentials() throws Exception {
        User user = UserTestUtils.createUser("alice", "alice@example.com");

        HttpResponse<String> response = get(userToken(user));

        assertEquals(200, response.statusCode());
        JsonNode servers = json.readTree(response.body());
        assertEquals("stun:localhost:3478", servers.get(0).get("urls").get(0).asText());

        JsonNode turn = servers.get(1);
        assertEquals("turn:localhost:3478?transport=udp", turn.get("urls").get(0).asText());
        assertEquals("turn:localhost:3478?transport=tcp", turn.get("urls").get(1).asText());

        String username = turn.get("username").asText();
        long expiry = Long.parseLong(username.substring(0, username.indexOf(':')));
        assertTrue(expiry > Instant.now().plusSeconds(11 * 3600).getEpochSecond(), "credentials last about 12 hours");
        assertTrue(expiry < Instant.now().plusSeconds(13 * 3600).getEpochSecond());

        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec("integration-turn-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
        String expected = Base64.getEncoder().encodeToString(mac.doFinal(username.getBytes(StandardCharsets.UTF_8)));
        assertEquals(expected, turn.get("credential").asText(), "coturn's use-auth-secret scheme");
    }

    @Test
    void meetingGuestsGetThemToo() throws Exception {
        User host = UserTestUtils.createUser("host", "host@example.com");
        Margin margin = MarginTestUtils.createMargin("Acme", host);
        MeetingDTO meeting = meetingService.createInstantMeeting(host.getId(), new CreateMeetingRequest(margin.getId(), "Sync", null));
        String guestToken = guestService.createGuestSession(meeting.code(), "Visitor").guestToken();

        assertEquals(200, get(guestToken).statusCode());
    }

    @Test
    void anonymousCallersGetNothing() throws Exception {
        assertEquals(401, get(null).statusCode());
    }
}
