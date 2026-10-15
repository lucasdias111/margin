package org.margin.server.authentication.services;

import lombok.extern.slf4j.Slf4j;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.AccountSummary;
import org.margin.server.users.api.Role;
import org.margin.server.users.api.UserAccountCommands;
import org.margin.server.users.api.UserLookup;
import org.margin.server.users.models.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;

/** What an instance admin can do to accounts. The last active admin can never be removed. */
@Service
@Slf4j
public class AdminAccountsService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserLookup userLookup;
    private final UserAccountCommands userAccountCommands;
    private final AuthenticationService authenticationService;
    private final PasswordResetService passwordResetService;

    public AdminAccountsService(UserLookup userLookup,
                                UserAccountCommands userAccountCommands,
                                AuthenticationService authenticationService,
                                PasswordResetService passwordResetService) {
        this.userLookup = userLookup;
        this.userAccountCommands = userAccountCommands;
        this.authenticationService = authenticationService;
        this.passwordResetService = passwordResetService;
    }

    public List<AccountSummary> list() {
        return userLookup.listAccounts();
    }

    /**
     * Creates an active account and returns a one-time link for its owner to choose a password.
     * The account has no encryption keys yet; they're generated the first time its owner logs in.
     */
    @Transactional
    public CreatedAccount create(String displayName, String email) {
        if (displayName == null || displayName.isBlank() || email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name and email are required");
        }
        try {
            authenticationService.createAccount(displayName.trim(), email.trim(), randomPassword(),
                    null, null, null, null, null, Role.USER, AccountStatus.ACTIVE, false);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        Long userId = userLookup.idByEmail(email.trim().toLowerCase()).orElseThrow();
        log.info("Admin created account userId={}", userId);
        return new CreatedAccount(userId, passwordResetService.issueResetLink(userId));
    }

    @Transactional
    public void setRole(Long actingAdminId, Long userId, Role role) {
        User user = account(userId);
        if (user.getRole() == Role.ADMIN && role != Role.ADMIN) {
            requireAnotherActiveAdmin(user);
        }
        userAccountCommands.setRole(userId, role);
        log.info("Admin {} set role of userId={} to {}", actingAdminId, userId, role);
    }

    @Transactional
    public void setStatus(Long actingAdminId, Long userId, AccountStatus status) {
        User user = account(userId);
        if (status != AccountStatus.ACTIVE) {
            requireAnotherActiveAdmin(user);
        }
        userAccountCommands.setStatus(userId, status);
        if (status == AccountStatus.DISABLED) {
            authenticationService.logoutAllDevices(userId);
        }
        log.info("Admin {} set status of userId={} to {}", actingAdminId, userId, status);
    }

    @Transactional
    public void delete(Long actingAdminId, Long userId) {
        User user = account(userId);
        requireAnotherActiveAdmin(user);
        authenticationService.logoutAllDevices(userId);
        userAccountCommands.deleteAccount(userId);
        log.info("Admin {} deleted userId={}", actingAdminId, userId);
    }

    @Transactional
    public String resetLink(Long userId) {
        account(userId);
        return passwordResetService.issueResetLink(userId);
    }

    private User account(Long userId) {
        return userLookup.findById(userId)
                .filter(user -> !user.isGuest() && user.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    private void requireAnotherActiveAdmin(User user) {
        boolean isActiveAdmin = user.getRole() == Role.ADMIN && user.getStatus() == AccountStatus.ACTIVE;
        if (isActiveAdmin && userAccountCommands.countActiveAdmins() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The instance must keep at least one active admin");
        }
    }

    private static String randomPassword() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    public record CreatedAccount(Long userId, String setPasswordLink) {
    }
}
