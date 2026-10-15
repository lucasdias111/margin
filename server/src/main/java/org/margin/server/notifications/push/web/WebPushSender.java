package org.margin.server.notifications.push.web;

import lombok.extern.slf4j.Slf4j;
import org.margin.server.notifications.push.PushMessage;
import org.margin.server.notifications.push.PushPlatform;
import org.margin.server.notifications.push.PushSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

/**
 * Sends notifications to browsers through their push service using the instance's own VAPID
 * keys, so operators need no FCM or APNs account. The stored token is the subscription JSON.
 */
@Component
@Slf4j
public class WebPushSender implements PushSender {

    private final VapidKeys vapidKeys;
    private final ObjectMapper json;
    private final String subject;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public WebPushSender(VapidKeys vapidKeys,
                         ObjectMapper json,
                         @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl) {
        this.vapidKeys = vapidKeys;
        this.json = json;
        this.subject = baseUrl;
    }

    @Override
    public PushPlatform platform() {
        return PushPlatform.WEB;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public void send(String token, PushMessage message) throws InvalidTokenException {
        try {
            JsonNode subscription = json.readTree(token);
            String endpoint = subscription.path("endpoint").asText();
            byte[] p256dh = WebPushCrypto.fromBase64Url(subscription.path("keys").path("p256dh").asText());
            byte[] auth = WebPushCrypto.fromBase64Url(subscription.path("keys").path("auth").asText());
            if (endpoint.isBlank() || !endpoint.startsWith("https://")) {
                throw new InvalidTokenException("Web push subscription has no https endpoint");
            }

            byte[] body = WebPushCrypto.encrypt(json.writeValueAsBytes(message), p256dh, auth);
            URI uri = URI.create(endpoint);
            VapidKeys.Loaded keys = vapidKeys.load();
            String authorization = WebPushCrypto.vapidAuthorization(
                    uri.getScheme() + "://" + uri.getAuthority(), subject,
                    Instant.now().plus(Duration.ofHours(12)).getEpochSecond(), keys.privateKey(), keys.publicKey());

            HttpResponse<String> response = client.send(HttpRequest.newBuilder(uri)
                            .timeout(Duration.ofSeconds(10))
                            .header("Authorization", authorization)
                            .header("Content-Encoding", "aes128gcm")
                            .header("Content-Type", "application/octet-stream")
                            .header("TTL", "86400")
                            .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                            .build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            int status = response.statusCode();
            if (status == 404 || status == 410) {
                throw new InvalidTokenException("Web push subscription expired (" + status + ")");
            }
            if (status / 100 != 2) {
                log.warn("Web push to {} failed with {}: {}", uri.getHost(), status, response.body());
            }
        } catch (InvalidTokenException e) {
            throw e;
        } catch (IllegalArgumentException | JacksonException | IOException e) {
            throw new InvalidTokenException("Unusable web push subscription: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.warn("Web push failed: {}", e.getMessage());
        }
    }
}
