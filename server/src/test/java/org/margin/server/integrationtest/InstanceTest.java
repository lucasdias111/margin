package org.margin.server.integrationtest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.margin.server.instance.api.MarginCreationPolicy;
import org.margin.server.instance.api.RegistrationMode;
import org.margin.server.instance.services.InstanceSettingsService;
import org.margin.server.instance.services.InstanceSettingsService.InstanceSettingsUpdate;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.sfu.services.CallCapacity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class InstanceTest extends MarginTestRunner {

    @LocalServerPort
    private int port;

    @Autowired
    private InstanceSettingsService settings;

    @Autowired
    private CallCapacity callCapacity;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    @AfterEach
    void restoreDefaults() {
        settings.update(new InstanceSettingsUpdate("localhost", RegistrationMode.INVITE,
                MarginCreationPolicy.EVERYONE, true, false, 0));
    }

    private JsonNode getInstance() throws Exception {
        HttpResponse<String> response = client.send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/instance")).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode(), "instance info must be readable without signing in");
        return json.readTree(response.body());
    }

    @Test
    void instanceInfoIsPublicAndDescribesTheInstance() throws Exception {
        JsonNode info = getInstance();

        assertEquals("localhost", info.get("name").asText(), "the name defaults to the base-url host");
        assertEquals("http://localhost:8080", info.get("publicUrl").asText());
        assertEquals("INVITE", info.get("registrationMode").asText(), "invite-only is the default");
        assertTrue(info.get("mailEnabled").asBoolean());
        assertFalse(info.get("features").get("gifs").asBoolean(), "gifs are off without a klipy key");
        assertTrue(info.hasNonNull("version"));
    }

    @Test
    void settingChangesShowUpImmediately() throws Exception {
        settings.update(new InstanceSettingsUpdate("Acme chat", RegistrationMode.OPEN, null, null, null, null));

        JsonNode info = getInstance();

        assertEquals("Acme chat", info.get("name").asText());
        assertEquals("OPEN", info.get("registrationMode").asText());
    }

    @Test
    void invalidSettingsAreRejected() {
        assertThrows(IllegalArgumentException.class, () ->
                settings.update(new InstanceSettingsUpdate(" ", null, null, null, null, null)));
        assertThrows(IllegalArgumentException.class, () ->
                settings.update(new InstanceSettingsUpdate(null, null, null, null, null, -1)));
    }

    @Test
    void callCapacityIsUnlimitedByDefaultAndFollowsTheSetting() {
        assertEquals(Integer.MAX_VALUE, callCapacity.maxParticipants());

        settings.update(new InstanceSettingsUpdate(null, null, null, null, null, 3));

        assertEquals(3, callCapacity.maxParticipants());
        assertEquals(3, callCapacity.requireRoomFor(2));
        assertThrows(ResponseStatusException.class, () -> callCapacity.requireRoomFor(3));
    }
}
