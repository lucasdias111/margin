package org.margin.server.authentication.services;

import lombok.extern.slf4j.Slf4j;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.Role;
import org.margin.server.users.api.UserAccountCommands;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Creates the first admin of a fresh instance. With MARGIN_ADMIN_EMAIL and MARGIN_ADMIN_PASSWORD
 * set, the admin is created on startup; otherwise a one-time setup link is logged for the operator.
 * "First sign-up becomes admin" is deliberately not supported: on a public server anyone could race
 * the operator to it.
 */
@Service
@Slf4j
public class FirstAdminSetup {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserAccountCommands userAccountCommands;
    private final AuthenticationService authenticationService;
    private final String baseUrl;
    private final String seedEmail;
    private final String seedPassword;

    private volatile String setupToken;

    public FirstAdminSetup(UserAccountCommands userAccountCommands,
                           AuthenticationService authenticationService,
                           @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl,
                           @Value("${margin.admin.email:}") String seedEmail,
                           @Value("${margin.admin.password:}") String seedPassword) {
        this.userAccountCommands = userAccountCommands;
        this.authenticationService = authenticationService;
        this.baseUrl = baseUrl;
        this.seedEmail = seedEmail;
        this.seedPassword = seedPassword;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        if (userAccountCommands.countAccounts() > 0) {
            return;
        }
        if (!seedEmail.isBlank() && !seedPassword.isBlank()) {
            createAdmin(displayNameFor(seedEmail), seedEmail, seedPassword, null, null, null, null);
            log.info("Created the first admin account for {} from MARGIN_ADMIN_EMAIL", seedEmail);
            return;
        }
        String token = newToken();
        setupToken = token;
        log.warn("No accounts yet. Create the first admin at {}/setup?token={}", baseUrl, token);
    }

    /** The setup token while the instance has no accounts yet, for the admin CLI to print again. */
    public java.util.Optional<String> pendingSetupToken() {
        return userAccountCommands.countAccounts() == 0
                ? java.util.Optional.ofNullable(setupToken)
                : java.util.Optional.empty();
    }

    public boolean isValidToken(String token) {
        String expected = setupToken;
        return expected != null && token != null
                && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))
                && userAccountCommands.countAccounts() == 0;
    }

    @Transactional
    public synchronized void completeSetup(String token, String displayName, String email, String password,
                                           String encryptedPrivateKey, String publicKey, String salt, String iv) {
        if (!isValidToken(token)) {
            throw new IllegalArgumentException("This setup link is no longer valid");
        }
        createAdmin(displayName, email, password, encryptedPrivateKey, publicKey, salt, iv);
        setupToken = null;
        log.info("First admin account created for {}", email);
    }

    private void createAdmin(String displayName, String email, String password,
                             String encryptedPrivateKey, String publicKey, String salt, String iv) {
        authenticationService.createAccount(displayName, email, password, encryptedPrivateKey, publicKey, salt, iv,
                null, Role.ADMIN, AccountStatus.ACTIVE, false);
    }

    private static String displayNameFor(String email) {
        String local = email.substring(0, Math.max(email.indexOf('@'), 0));
        return local.isBlank() ? "Admin" : local;
    }

    private static String newToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
