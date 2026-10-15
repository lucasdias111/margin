package org.margin.server.authentication.services;

import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.margin.server.authentication.entities.ActivationKey;
import org.margin.server.authentication.entities.UserSecurity;
import org.margin.server.authentication.events.UserSessionsRevokedEvent;
import org.margin.server.authentication.exceptions.InvalidRefreshTokenException;
import org.margin.server.authentication.exceptions.RegistrationException;
import org.margin.server.authentication.models.AuthResponse;
import org.margin.server.email.EmailService;
import org.margin.server.instance.api.InstanceSettings;
import org.margin.server.social.api.MarginLookup;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.Role;
import org.margin.server.users.api.ProfilePictureCommands;
import org.margin.server.users.api.UserAccountCommands;
import org.margin.server.users.api.UserLookup;
import org.margin.server.users.models.User;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;

@Service
@Slf4j
public class AuthenticationService {
    private static final int MAX_FAILED_ATTEMPTS = 3;
    private static final int LOCK_DURATION_SECONDS = 30;

    private final AuthenticationManager authenticationManager;
    private final UserLookup userLookup;
    private final UserAccountCommands userAccountCommands;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final ProfilePictureCommands profilePictureCommands;
    private final ApplicationEventPublisher eventPublisher;
    private final ActivationKeyService activationKeyService;
    private final EmailService emailService;
    private final UserSecurityService userSecurityService;
    private final RefreshTokenService refreshTokenService;
    private final InstanceSettings instanceSettings;
    private final InviteCodeService inviteCodeService;
    private final MarginLookup marginLookup;

    public AuthenticationService(
            AuthenticationManager authenticationManager,
            UserLookup userLookup,
            UserAccountCommands userAccountCommands,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            ProfilePictureCommands profilePictureCommands,
            ApplicationEventPublisher eventPublisher,
            ActivationKeyService activationKeyService,
            EmailService emailService,
            UserSecurityService userSecurityService,
            RefreshTokenService refreshTokenService,
            InstanceSettings instanceSettings,
            InviteCodeService inviteCodeService,
            MarginLookup marginLookup) {
        this.authenticationManager = authenticationManager;
        this.userLookup = userLookup;
        this.userAccountCommands = userAccountCommands;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.profilePictureCommands = profilePictureCommands;
        this.eventPublisher = eventPublisher;
        this.activationKeyService = activationKeyService;
        this.emailService = emailService;
        this.userSecurityService = userSecurityService;
        this.refreshTokenService = refreshTokenService;
        this.instanceSettings = instanceSettings;
        this.inviteCodeService = inviteCodeService;
        this.marginLookup = marginLookup;
    }

    public AuthResponse authenticateUser(String email, String password) {
        String normalisedEmail = email.toLowerCase();
        log.info("Login attempt for email {}", normalisedEmail);
        try {
            User user = userLookup.findByEmail(normalisedEmail)
                    .orElseThrow(() -> new BadCredentialsException("user not found"));

            if (user.isGuest()) {
                log.warn("Login blocked — userId {} is a guest account", user.getId());
                throw new BadCredentialsException("guest account");
            }

            if (!activationKeyService.isUserActivated(user.getId())) {
                log.warn("Login blocked — userId {} not yet activated", user.getId());
                return AuthResponse.failure("User is not yet activated");
            }

            if (user.getStatus() == AccountStatus.PENDING_APPROVAL) {
                log.warn("Login blocked — userId {} is waiting for approval", user.getId());
                return AuthResponse.failure("Your account is waiting for an admin to approve it");
            }

            if (user.getStatus() == AccountStatus.DISABLED) {
                log.warn("Login blocked — userId {} is disabled", user.getId());
                return AuthResponse.failure("Your account has been disabled");
            }

            UserSecurity security = userSecurityService.get(user.getId());
            if (isAccountLocked(security)) {
                log.warn("Login blocked — userId {} locked until {}", user.getId(), security.getAccountLockedUntil());
                throw new BadCredentialsException("account locked");
            }

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalisedEmail, password)
            );

            resetFailedAttempts(security);
            String token = jwtService.generateToken(email, user.getId(), security.getTokenVersion());
            String refreshToken = refreshTokenService.issue(user.getId()).value();
            log.info("Login successful for userId {}", user.getId());

            return new AuthResponse(
                    true,
                    "Login successful",
                    token,
                    refreshToken,
                    user.getEncryption().getPublicKey(),
                    user.getEncryption().getEncryptedPrivateKey(),
                    user.getEncryption().getSalt(),
                    user.getEncryption().getIv());

        } catch (BadCredentialsException e) {
            log.warn("Login failed for email {} reason {}", normalisedEmail, e.getMessage());
            handleFailedLogin(normalisedEmail);
            return AuthResponse.failure("Invalid credentials");
        }
    }

    public AuthResponse refresh(String presentedRefreshToken) {
        RefreshTokenService.RotatedToken rotated = refreshTokenService.rotate(presentedRefreshToken);
        User user = userLookup.findById(rotated.userId())
                .orElseThrow(InvalidRefreshTokenException::new);

        if (user.isGuest()) {
            throw new InvalidRefreshTokenException();
        }

        String accessToken = jwtService.generateToken(
                user.getEmail(), user.getId(), userSecurityService.get(user.getId()).getTokenVersion());

        return new AuthResponse(
                true,
                "Token refreshed",
                accessToken,
                rotated.token().value(),
                user.getEncryption().getPublicKey(),
                user.getEncryption().getEncryptedPrivateKey(),
                user.getEncryption().getSalt(),
                user.getEncryption().getIv());
    }

    /** Self-service sign-up, subject to the instance's registration mode and approval setting. */
    @Transactional
    public ActivationKey registerUser(String displayName,
                                      String email,
                                      String password,
                                      String privateKey,
                                      String publicKey,
                                      String salt,
                                      String iv,
                                      String inviteCode,
                                      MultipartFile profilePicture) {
        if (userAccountCommands.emailIsTaken(email)) {
            throw new IllegalArgumentException("Email already in use");
        }
        requireSignUpAllowed(inviteCode);

        AccountStatus status = instanceSettings.requireAccountApproval()
                ? AccountStatus.PENDING_APPROVAL
                : AccountStatus.ACTIVE;
        return createAccount(displayName, email, password, privateKey, publicKey, salt, iv, profilePicture,
                Role.USER, status, instanceSettings.requireEmailVerification());
    }

    private void requireSignUpAllowed(String inviteCode) {
        switch (instanceSettings.registrationMode()) {
            case OPEN -> {
            }
            case CLOSED -> throw new IllegalArgumentException("Sign-up is closed on this instance");
            case INVITE -> {
                // A margin's own invite link counts as an invite, so margin owners can onboard their team.
                boolean invited = marginLookup.isUsableLinkInvite(inviteCode) || inviteCodeService.redeem(inviteCode);
                if (!invited) {
                    throw new IllegalArgumentException("A valid invite code is required to sign up");
                }
            }
        }
    }

    /** Creates an account without applying registration policy: used by admins and the first-admin setup. */
    @Transactional
    public ActivationKey createAccount(String displayName,
                                       String email,
                                       String password,
                                       String privateKey,
                                       String publicKey,
                                       String salt,
                                       String iv,
                                       MultipartFile profilePicture,
                                       Role role,
                                       AccountStatus status,
                                       boolean requireEmailVerification) {
        if (userAccountCommands.emailIsTaken(email)) {
            throw new IllegalArgumentException("Email already in use");
        }

        String profilePictureUrl = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePictureUrl = profilePictureCommands.save(profilePicture);
        }

        Long userId = userAccountCommands.register(new UserAccountCommands.NewUser(
                displayName, email, passwordEncoder.encode(password), profilePictureUrl,
                publicKey, privateKey, salt, iv, role, status));

        UserSecurity security = new UserSecurity(userId);
        security.setFailedLoginAttempts(0);
        userSecurityService.save(security);

        ActivationKey activationKey = activationKeyService.generateActivationKey(userId);

        if (!requireEmailVerification) {
            activationKeyService.findAndConsumeActivationKey(activationKey.getToken());
            log.info("Email verification off — user {} auto-activated", email);
            return activationKey;
        }

        String registrationContent = emailService.buildRegistrationMail(displayName, activationKey.getToken());
        try {
            emailService.sendEmail(email, "Email activation for margin", registrationContent);
        } catch (MessagingException _) {
            throw new RegistrationException("Failed to send activation email for margin");
        }

        log.info("Email registration sent for user {}", email);

        return activationKey;
    }

    private boolean isAccountLocked(UserSecurity security) {
        if (security.getAccountLockedUntil() == null) {
            return false;
        }
        return security.getAccountLockedUntil().isAfter(Instant.now());
    }

    private void handleFailedLogin(String email) {
        userLookup.findByEmail(email.toLowerCase()).ifPresent(user -> {
            UserSecurity security = userSecurityService.get(user.getId());
            security.setFailedLoginAttempts(security.getFailedLoginAttempts() + 1);
            security.setLastFailedLoginAttempt(Instant.now());

            if (security.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                security.setAccountLockedUntil(Instant.now().plusSeconds(LOCK_DURATION_SECONDS));
                log.warn("Account locked for user {} until {}",
                        user.getDisplayName(), security.getAccountLockedUntil());
            }

            userSecurityService.save(security);
        });
    }

    private void resetFailedAttempts(UserSecurity security) {
        if (security.getFailedLoginAttempts() > 0) {
            security.setFailedLoginAttempts(0);
            security.setLastFailedLoginAttempt(null);
            security.setAccountLockedUntil(null);
            userSecurityService.save(security);
        }
    }

    @Transactional
    public void logoutUser(Long userId, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            logoutAllDevices(userId);
            return;
        }
        refreshTokenService.revoke(refreshToken);
        eventPublisher.publishEvent(new UserSessionsRevokedEvent(userId));
    }

    @Transactional
    public void logoutAllDevices(Long userId) {
        userSecurityService.bumpTokenVersion(userId);
        refreshTokenService.revokeAllForUser(userId);
        userAccountCommands.invalidateCachedUser(userId);
        eventPublisher.publishEvent(new UserSessionsRevokedEvent(userId));
    }

    @Transactional
    public void updateEncryptionKeys(Long userId, String publicKey, String encryptedPrivateKey, String salt, String iv) {
        userAccountCommands.updateEncryptionKeys(userId, publicKey, encryptedPrivateKey, salt, iv);
    }
}