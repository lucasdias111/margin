package org.margin.server.authentication.controllers;

import org.margin.server.authentication.entities.InviteCode;
import org.margin.server.authentication.services.AdminAccountsService;
import org.margin.server.authentication.services.AdminAccountsService.CreatedAccount;
import org.margin.server.authentication.services.InviteCodeService;
import org.margin.server.email.EmailService;
import org.margin.server.shared.security.AuthenticatedUser;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.AccountSummary;
import org.margin.server.users.api.AdminAccess;
import org.margin.server.users.api.Role;
import org.margin.server.users.api.UserLookup;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminAccountsController {

    private final AdminAccess adminAccess;
    private final AdminAccountsService accounts;
    private final InviteCodeService inviteCodes;
    private final EmailService emailService;
    private final UserLookup userLookup;

    public AdminAccountsController(AdminAccess adminAccess,
                                   AdminAccountsService accounts,
                                   InviteCodeService inviteCodes,
                                   EmailService emailService,
                                   UserLookup userLookup) {
        this.adminAccess = adminAccess;
        this.accounts = accounts;
        this.inviteCodes = inviteCodes;
        this.emailService = emailService;
        this.userLookup = userLookup;
    }

    @GetMapping("/users")
    public List<AccountSummary> listUsers(@AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        return accounts.list();
    }

    @PostMapping("/users")
    public CreatedAccount createUser(@RequestBody CreateUserRequest request,
                                     @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        return accounts.create(request.displayName(), request.email());
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<Void> updateUser(@PathVariable Long userId,
                                           @RequestBody UpdateUserRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        if (request.role() != null) {
            accounts.setRole(admin.id(), userId, request.role());
        }
        if (request.status() != null) {
            accounts.setStatus(admin.id(), userId, request.status());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId,
                                           @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        accounts.delete(admin.id(), userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/reset-link")
    public ResetLink resetLink(@PathVariable Long userId,
                               @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        return new ResetLink(accounts.resetLink(userId));
    }

    @GetMapping("/invite-codes")
    public List<InviteCodeView> listInviteCodes(@AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        Instant now = Instant.now();
        return inviteCodes.list().stream().map(code -> InviteCodeView.of(code, now)).toList();
    }

    @PostMapping("/invite-codes")
    public InviteCodeView createInviteCode(@RequestBody CreateInviteCodeRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        try {
            return InviteCodeView.of(inviteCodes.create(admin.id(), request.maxUses(), request.expiresAt()), Instant.now());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @DeleteMapping("/invite-codes/{inviteCodeId}")
    public ResponseEntity<Void> revokeInviteCode(@PathVariable Long inviteCodeId,
                                                 @AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        inviteCodes.revoke(inviteCodeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/mail/test")
    public ResponseEntity<Void> sendTestMail(@AuthenticationPrincipal AuthenticatedUser admin) {
        adminAccess.requireAdmin(admin.id());
        String to = userLookup.contactOf(admin.id()).email();
        try {
            emailService.sendEmail(to, "margin test email", "<p>Mail from your margin instance works.</p>");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Sending failed: " + e.getMessage());
        }
        return ResponseEntity.noContent().build();
    }

    public record CreateUserRequest(String displayName, String email) {
    }

    public record UpdateUserRequest(Role role, AccountStatus status) {
    }

    public record ResetLink(String link) {
    }

    public record CreateInviteCodeRequest(Integer maxUses, Instant expiresAt) {
    }

    public record InviteCodeView(Long id, String code, Integer maxUses, int useCount, Instant expiresAt,
                                 boolean revoked, boolean usable, Instant createdAt) {
        static InviteCodeView of(InviteCode code, Instant now) {
            return new InviteCodeView(code.getId(), code.getCode(), code.getMaxUses(), code.getUseCount(),
                    code.getExpiresAt(), code.getRevokedAt() != null, code.isUsable(now), code.getCreatedAt());
        }
    }
}
