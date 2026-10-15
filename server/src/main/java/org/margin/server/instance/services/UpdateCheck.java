package org.margin.server.instance.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

/**
 * Asks GitHub once a day whether a newer margin release exists, so admins see "update available".
 * Nothing about the instance is sent. UPDATE_CHECK=false turns it off.
 */
@Service
@Slf4j
public class UpdateCheck {

    private final boolean enabled;
    private final String currentVersion;
    private final String releasesUrl;
    private final ObjectMapper json;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private volatile Status status;

    public UpdateCheck(@Value("${margin.update-check.enabled:true}") boolean enabled,
                       @Value("${margin.version:dev}") String currentVersion,
                       @Value("${margin.update-check.url:https://api.github.com/repos/lucasdias111/margin/releases/latest}") String releasesUrl,
                       ObjectMapper json) {
        this.enabled = enabled;
        this.currentVersion = currentVersion;
        this.releasesUrl = releasesUrl;
        this.json = json;
        this.status = new Status(enabled, currentVersion, null, false, null, null);
    }

    public Status status() {
        return status;
    }

    @Scheduled(initialDelayString = "PT2M", fixedDelayString = "P1D")
    public void scheduledCheck() {
        if (enabled) {
            check();
        }
    }

    public Status check() {
        try {
            HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create(releasesUrl))
                            .timeout(Duration.ofSeconds(10))
                            .header("Accept", "application/vnd.github+json")
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.info("Update check got {} from GitHub", response.statusCode());
                return status;
            }
            JsonNode release = json.readTree(response.body());
            String latest = release.path("tag_name").asText(null);
            String url = release.path("html_url").asText(null);
            status = new Status(enabled, currentVersion, latest, isNewer(latest, currentVersion), url, Instant.now());
        } catch (Exception e) {
            log.info("Update check failed: {}", e.getMessage());
        }
        return status;
    }

    /** True when {@code candidate} is a higher x.y.z than {@code current}; development builds never are. */
    static boolean isNewer(String candidate, String current) {
        int[] a = parse(candidate);
        int[] b = parse(current);
        if (a == null || b == null) {
            return false;
        }
        for (int i = 0; i < 3; i++) {
            if (a[i] != b[i]) {
                return a[i] > b[i];
            }
        }
        return false;
    }

    private static int[] parse(String version) {
        if (version == null) {
            return null;
        }
        String[] parts = version.replaceFirst("^v", "").split("[.-]");
        if (parts.length < 3) {
            return null;
        }
        try {
            return new int[]{Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), Integer.parseInt(parts[2])};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public record Status(boolean enabled,
                         String currentVersion,
                         String latestVersion,
                         boolean updateAvailable,
                         String releaseUrl,
                         Instant checkedAt) {
    }
}
