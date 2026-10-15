package org.margin.server.unittest;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.margin.server.instance.services.UpdateCheck;
import tools.jackson.databind.json.JsonMapper;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class UpdateCheckTest {

    private HttpServer github;
    private volatile String latestTag = "v1.2.0";

    @BeforeEach
    void startFakeGithub() throws Exception {
        github = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        github.createContext("/", exchange -> {
            byte[] body = ("{\"tag_name\":\"" + latestTag + "\",\"html_url\":\"https://github.com/lucasdias111/margin/releases/tag/"
                    + latestTag + "\"}").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        github.start();
    }

    @AfterEach
    void stop() {
        github.stop(0);
    }

    private UpdateCheck checkFor(String currentVersion) {
        return new UpdateCheck(true, currentVersion,
                "http://127.0.0.1:" + github.getAddress().getPort() + "/latest", JsonMapper.builder().build());
    }

    @Test
    void aNewerReleaseIsReported() {
        UpdateCheck.Status status = checkFor("1.1.4").check();

        assertTrue(status.updateAvailable());
        assertEquals("v1.2.0", status.latestVersion());
        assertTrue(status.releaseUrl().endsWith("/v1.2.0"));
        assertNotNull(status.checkedAt());
    }

    @Test
    void theSameOrAnOlderReleaseIsNot() {
        assertFalse(checkFor("1.2.0").check().updateAvailable());
        assertFalse(checkFor("1.10.0").check().updateAvailable(), "compared as numbers, not text");
    }

    @Test
    void developmentBuildsNeverNag() {
        assertFalse(checkFor("dev").check().updateAvailable());
    }

    @Test
    void anUnreachableGithubLeavesTheLastKnownStatus() {
        UpdateCheck check = new UpdateCheck(true, "1.0.0", "http://127.0.0.1:1/latest", JsonMapper.builder().build());

        UpdateCheck.Status status = check.check();

        assertFalse(status.updateAvailable());
        assertNull(status.checkedAt());
    }
}
