package org.margin.server.authentication.services;

import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.margin.server.authentication.entities.PasswordResetToken;
import org.margin.server.authentication.repositories.PasswordResetTokenRepository;
import org.margin.server.email.EmailService;
import org.margin.server.users.api.UserAccountCommands;
import org.margin.server.users.api.UserLookup;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
@Slf4j
public class PasswordResetService {

    private static final int EXPIRY_SECONDS = 3600;
    private static final int ADMIN_LINK_EXPIRY_SECONDS = 7 * 24 * 3600;

    private final UserLookup userLookup;
    private final UserAccountCommands userAccountCommands;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final UserSecurityService userSecurityService;
    private final RefreshTokenService refreshTokenService;
    private final String baseUrl;

    public PasswordResetService(UserLookup userLookup,
                                UserAccountCommands userAccountCommands,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService,
                                UserSecurityService userSecurityService,
                                RefreshTokenService refreshTokenService,
                                @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl) {
        this.userLookup = userLookup;
        this.userAccountCommands = userAccountCommands;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.userSecurityService = userSecurityService;
        this.refreshTokenService = refreshTokenService;
        this.baseUrl = baseUrl;
    }

    /**
     * A one-time link an admin hands to someone out of band, for a forgotten password or a brand new
     * account. Valid for a week; any earlier link for the same user stops working.
     */
    @Transactional
    public String issueResetLink(Long userId) {
        tokenRepository.deleteByUserId(userId);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserId(userId);
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setExpiresAt(Instant.now().plusSeconds(ADMIN_LINK_EXPIRY_SECONDS));
        tokenRepository.save(resetToken);

        log.info("Admin-issued password reset link created for userId={}", userId);
        return baseUrl + "/reset-password/" + resetToken.getToken();
    }

    @Transactional
    public void requestPasswordReset(String email) {
        String normalised = email.toLowerCase();
        log.info("Password reset requested for email {}", normalised);
        userLookup.findByEmail(normalised).ifPresent(user -> {
            tokenRepository.deleteByUserId(user.getId());

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUserId(user.getId());
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setExpiresAt(Instant.now().plusSeconds(EXPIRY_SECONDS));
            tokenRepository.save(resetToken);

            String body = emailService.buildPasswordResetMail(user.getDisplayName(), resetToken.getToken());
            try {
                emailService.sendEmail(user.getEmail(), "Reset your margin password", body);
                log.info("Password reset email sent to userId={}", user.getId());
            } catch (MessagingException e) {
                log.error("Failed to send password reset email to userId={}", user.getId(), e);
            }
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Password reset attempt for token prefix {}", token.length() > 8 ? token.substring(0, 8) : "short");

        PasswordResetToken resetToken = tokenRepository.findByToken(token).orElse(null);
        if (resetToken == null) {
            log.warn("Password reset failed — token not found");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired token");
        }

        if (resetToken.isExpired()) {
            log.warn("Password reset failed — token expired at {} userId {}", resetToken.getExpiresAt(), resetToken.getUserId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token has expired");
        }

        if (resetToken.isUsed()) {
            log.warn("Password reset failed — token already used at {} userId {}", resetToken.getUsedAt(), resetToken.getUserId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token has already been used");
        }

        Long userId = resetToken.getUserId();
        userAccountCommands.resetCredentials(userId, passwordEncoder.encode(newPassword));
        // Bumping the token version alone would leave refresh tokens usable, so whoever prompted
        // the reset could mint new access tokens indefinitely. Both have to go.
        userSecurityService.bumpTokenVersion(userId);
        refreshTokenService.revokeAllForUser(userId);
        log.info("Encryption keys cleared for userId {} — will be regenerated on next login", userId);

        resetToken.setUsedAt(Instant.now());
        tokenRepository.save(resetToken);

        log.info("Password reset successfully for userId {}", userId);
    }
}