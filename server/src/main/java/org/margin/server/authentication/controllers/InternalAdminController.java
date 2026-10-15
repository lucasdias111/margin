package org.margin.server.authentication.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.margin.server.authentication.services.FirstAdminSetup;
import org.margin.server.authentication.services.PasswordResetService;
import org.margin.server.users.api.UserLookup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Backs the {@code margin} command inside the server container. Only answers requests from the
 * same machine that carry the internal API key, so shell access to the host is the authority.
 */
@RestController
@RequestMapping("/api/internal")
public class InternalAdminController {

    private final PasswordResetService passwordResetService;
    private final FirstAdminSetup firstAdminSetup;
    private final UserLookup userLookup;
    private final String internalApiKey;
    private final String baseUrl;

    public InternalAdminController(PasswordResetService passwordResetService,
                                   FirstAdminSetup firstAdminSetup,
                                   UserLookup userLookup,
                                   @Value("${sfu.internal-api-key}") String internalApiKey,
                                   @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl) {
        this.passwordResetService = passwordResetService;
        this.firstAdminSetup = firstAdminSetup;
        this.userLookup = userLookup;
        this.internalApiKey = internalApiKey;
        this.baseUrl = baseUrl;
    }

    @PostMapping("/reset-link")
    public String resetLink(@RequestParam String email,
                            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
                            HttpServletRequest request) {
        requireLocalCaller(apiKey, request);
        Long userId = userLookup.idByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account with that email"));
        return passwordResetService.issueResetLink(userId);
    }

    @GetMapping("/setup-link")
    public String setupLink(@RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
                            HttpServletRequest request) {
        requireLocalCaller(apiKey, request);
        return firstAdminSetup.pendingSetupToken()
                .map(token -> baseUrl + "/setup?token=" + token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "The instance already has accounts"));
    }

    private void requireLocalCaller(String apiKey, HttpServletRequest request) {
        boolean keyMatches = apiKey != null && MessageDigest.isEqual(
                internalApiKey.getBytes(StandardCharsets.UTF_8), apiKey.getBytes(StandardCharsets.UTF_8));
        if (!keyMatches || !isLoopback(request.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private static boolean isLoopback(String address) {
        try {
            return InetAddress.getByName(address).isLoopbackAddress();
        } catch (UnknownHostException e) {
            return false;
        }
    }
}
