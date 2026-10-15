package org.margin.server.sfu;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

/**
 * ICE servers for calls, with short-lived TURN credentials in coturn's REST-API scheme
 * ({@code use-auth-secret}): the username is {@code <expiry>:<label>} and the password is
 * base64(HMAC-SHA1(TURN_SECRET, username)). Signed-in users and meeting guests may both ask.
 * Without a TURN secret only STUN is offered.
 */
@RestController
public class IceServersController {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final String secret;
    private final Duration ttl;
    private final List<String> turnUris;
    private final List<String> stunUris;

    public IceServersController(@Value("${margin.turn.secret:}") String secret,
                                @Value("${margin.turn.uris:}") String configuredUris,
                                @Value("${margin.turn.ttl:12h}") Duration ttl,
                                @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl) {
        this.secret = secret;
        this.ttl = ttl;
        String host = URI.create(baseUrl).getHost();
        List<String> uris = configuredUris.isBlank()
                ? List.of("turn:" + host + ":3478?transport=udp", "turn:" + host + ":3478?transport=tcp")
                : Arrays.stream(configuredUris.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        this.turnUris = uris.stream().filter(u -> u.startsWith("turn:") || u.startsWith("turns:")).toList();
        List<String> stun = new ArrayList<>(uris.stream().filter(u -> u.startsWith("stun:")).toList());
        if (stun.isEmpty()) {
            stun.add("stun:" + host + ":3478");
        }
        this.stunUris = List.copyOf(stun);
    }

    @GetMapping("/api/ice-servers")
    public List<IceServer> iceServers() {
        List<IceServer> servers = new ArrayList<>();
        servers.add(new IceServer(stunUris, null, null));
        if (!secret.isBlank() && !turnUris.isEmpty()) {
            String username = Instant.now().plus(ttl).getEpochSecond() + ":" + randomLabel();
            servers.add(new IceServer(turnUris, username, credentialFor(username)));
        }
        return servers;
    }

    String credentialFor(String username) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return Base64.getEncoder().encodeToString(mac.doFinal(username.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA1 is unavailable", e);
        }
    }

    private static String randomLabel() {
        byte[] bytes = new byte[6];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** Shaped like the browser's RTCIceServer. */
    public record IceServer(List<String> urls, String username, String credential) {
    }
}
