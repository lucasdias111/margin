package org.margin.server.integrationtest;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.margin.server.authentication.controllers.AdminAccountsController;
import org.margin.server.authentication.controllers.AdminAccountsController.CreateInviteCodeRequest;
import org.margin.server.authentication.controllers.AdminAccountsController.CreateUserRequest;
import org.margin.server.authentication.controllers.AdminAccountsController.InviteCodeView;
import org.margin.server.authentication.controllers.AdminAccountsController.UpdateUserRequest;
import org.margin.server.authentication.services.AdminAccountsService.CreatedAccount;
import org.margin.server.instance.api.MarginCreationPolicy;
import org.margin.server.instance.api.RegistrationMode;
import org.margin.server.instance.controllers.AdminSettingsController;
import org.margin.server.instance.services.InstanceSettingsService;
import org.margin.server.instance.services.InstanceSettingsService.InstanceSettingsUpdate;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.AuthTestUtils;
import org.margin.server.integrationtest.utils.MarginTestUtils;
import org.margin.server.integrationtest.utils.PasswordResetTestUtils;
import org.margin.server.integrationtest.utils.UserTestUtils;
import org.margin.server.social.margin.controllers.AdminMarginsController;
import org.margin.server.social.margin.controllers.AdminMarginsController.MarginOverview;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.AccountSummary;
import org.margin.server.users.api.Role;
import org.margin.server.users.controllers.UserController;
import org.margin.server.users.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.margin.server.integrationtest.utils.UserTestUtils.principalOf;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class AdminTest extends MarginTestRunner {

    @Autowired
    private AdminAccountsController accounts;

    @Autowired
    private AdminSettingsController settingsController;

    @Autowired
    private AdminMarginsController margins;

    @Autowired
    private InstanceSettingsService settings;

    @Autowired
    private UserController users;

    private User admin;
    private User member;

    @BeforeEach
    void setUp() {
        admin = UserTestUtils.createUser("admin", "admin@example.com");
        UserTestUtils.accountCommands().setRole(admin.getId(), Role.ADMIN);
        member = UserTestUtils.createUser("member", "member@example.com");
    }

    @AfterEach
    void restoreDefaults() {
        settings.update(new InstanceSettingsUpdate(null, RegistrationMode.INVITE, MarginCreationPolicy.EVERYONE,
                null, false, 0));
    }

    private static HttpStatus statusOf(Runnable call) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, call::run);
        return HttpStatus.valueOf(e.getStatusCode().value());
    }

    @Test
    void nonAdminsAreTurnedAwayEverywhere() {
        var principal = principalOf(member);
        assertEquals(HttpStatus.FORBIDDEN, statusOf(() -> accounts.listUsers(principal)));
        assertEquals(HttpStatus.FORBIDDEN, statusOf(() -> accounts.listInviteCodes(principal)));
        assertEquals(HttpStatus.FORBIDDEN, statusOf(() -> settingsController.get(principal)));
        assertEquals(HttpStatus.FORBIDDEN, statusOf(() -> margins.list(principal)));
    }

    @Test
    void adminsSeeEveryAccount() {
        List<AccountSummary> users = accounts.listUsers(principalOf(admin));

        assertEquals(2, users.size());
        assertTrue(users.stream().anyMatch(u -> u.id().equals(admin.getId()) && u.role() == Role.ADMIN));
    }

    @Test
    void anAdminCreatedAccountIsClaimedThroughItsLink() {
        CreatedAccount created = accounts.createUser(new CreateUserRequest("Newbie", "newbie@example.com"), principalOf(admin));
        String token = created.setPasswordLink().substring(created.setPasswordLink().lastIndexOf('/') + 1);
        assertTrue(created.setPasswordLink().startsWith("http://localhost:8080/reset-password/"));

        PasswordResetTestUtils.resetPassword(token, "chosen-password");

        assertTrue(AuthTestUtils.login("newbie@example.com", "chosen-password").success());
    }

    @Test
    void theLastActiveAdminCannotBeRemoved() {
        var principal = principalOf(admin);
        assertEquals(HttpStatus.CONFLICT, statusOf(() ->
                accounts.updateUser(admin.getId(), new UpdateUserRequest(Role.USER, null), principal)));
        assertEquals(HttpStatus.CONFLICT, statusOf(() ->
                accounts.updateUser(admin.getId(), new UpdateUserRequest(null, AccountStatus.DISABLED), principal)));
        assertEquals(HttpStatus.CONFLICT, statusOf(() -> accounts.deleteUser(admin.getId(), principal)));

        accounts.updateUser(member.getId(), new UpdateUserRequest(Role.ADMIN, null), principal);
        accounts.updateUser(admin.getId(), new UpdateUserRequest(Role.USER, null), principal);

        assertEquals(Role.USER, UserTestUtils.findById(admin.getId()).getRole());
    }

    @Test
    void disablingAndApprovingAccounts() {
        accounts.updateUser(member.getId(), new UpdateUserRequest(null, AccountStatus.DISABLED), principalOf(admin));
        assertEquals(AccountStatus.DISABLED, UserTestUtils.findById(member.getId()).getStatus());

        accounts.updateUser(member.getId(), new UpdateUserRequest(null, AccountStatus.ACTIVE), principalOf(admin));
        assertEquals(AccountStatus.ACTIVE, UserTestUtils.findById(member.getId()).getStatus());
    }

    @Test
    void deletedAccountsDisappearFromTheList() {
        accounts.deleteUser(member.getId(), principalOf(admin));

        assertTrue(accounts.listUsers(principalOf(admin)).stream().noneMatch(u -> u.id().equals(member.getId())));
    }

    @Test
    void inviteCodesCanBeIssuedAndRevoked() {
        InviteCodeView code = accounts.createInviteCode(new CreateInviteCodeRequest(5, null), principalOf(admin));
        assertTrue(code.usable());

        accounts.revokeInviteCode(code.id(), principalOf(admin));

        InviteCodeView listed = accounts.listInviteCodes(principalOf(admin)).stream()
                .filter(c -> c.id().equals(code.id())).findFirst().orElseThrow();
        assertTrue(listed.revoked());
        assertFalse(listed.usable());
    }

    @Test
    void settingsCanBeChangedByAdmins() {
        var updated = settingsController.update(
                new InstanceSettingsUpdate("Acme", RegistrationMode.CLOSED, null, null, null, 8), principalOf(admin));

        assertEquals("Acme", updated.instanceName());
        assertEquals(RegistrationMode.CLOSED, updated.registrationMode());
        assertEquals(8, updated.maxCallParticipants());
        assertEquals(HttpStatus.BAD_REQUEST, statusOf(() -> settingsController.update(
                new InstanceSettingsUpdate(null, null, null, null, null, -5), principalOf(admin))));
        settingsController.update(new InstanceSettingsUpdate("localhost", null, null, null, null, null), principalOf(admin));
    }

    @Test
    void adminsSeeMarginMetadataAndCanDeleteMargins() {
        Margin margin = MarginTestUtils.createMargin("Acme", member);

        MarginOverview overview = margins.list(principalOf(admin)).stream()
                .filter(m -> m.id().equals(margin.getId())).findFirst().orElseThrow();
        assertEquals("Acme", overview.name());
        assertEquals(member.getId(), overview.owner().id());
        assertEquals(1, overview.memberCount());
        assertEquals(0, overview.storageBytes());

        margins.delete(margin.getId(), principalOf(admin));

        assertTrue(margins.list(principalOf(admin)).stream().noneMatch(m -> m.id().equals(margin.getId())));
    }

    @Test
    void marginCreationCanBeLimitedToAdmins() {
        settings.update(new InstanceSettingsUpdate(null, null, MarginCreationPolicy.ADMINS_ONLY, null, null, null));

        assertThrows(ResponseStatusException.class, () -> MarginTestUtils.createMargin("Nope", member));
        assertDoesNotThrow(() -> MarginTestUtils.createMargin("Yes", admin));
    }

    @Test
    void theCurrentUserLearnsTheirInstanceRole() {
        assertEquals(Role.ADMIN, users.getCurrentUser(principalOf(admin)).role());
        assertEquals(Role.USER, users.getCurrentUser(principalOf(member)).role());
    }
}
