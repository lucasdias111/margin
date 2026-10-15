package org.margin.server.integrationtest;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.margin.server.authentication.entities.InviteCode;
import org.margin.server.authentication.models.AuthResponse;
import org.margin.server.authentication.services.FirstAdminSetup;
import org.margin.server.authentication.services.InviteCodeService;
import org.margin.server.instance.api.RegistrationMode;
import org.margin.server.instance.services.InstanceSettingsService;
import org.margin.server.instance.services.InstanceSettingsService.InstanceSettingsUpdate;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.AuthTestUtils;
import org.margin.server.integrationtest.utils.MarginTestUtils;
import org.margin.server.integrationtest.utils.UserTestUtils;
import org.margin.server.social.margin.entities.Margin;
import org.margin.server.social.margin.entities.MarginInvite;
import org.margin.server.social.margin.service.MarginInviteService;
import org.margin.server.users.api.AccountStatus;
import org.margin.server.users.api.Role;
import org.margin.server.users.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class RegistrationPolicyTest extends MarginTestRunner {

    @Autowired
    private InstanceSettingsService settings;

    @Autowired
    private InviteCodeService inviteCodes;

    @Autowired
    private MarginInviteService marginInvites;

    @Autowired
    private FirstAdminSetup firstAdminSetup;

    @AfterEach
    void restoreDefaults() {
        settings.update(new InstanceSettingsUpdate(null, RegistrationMode.INVITE, null, null, false, null));
    }

    private void mode(RegistrationMode mode) {
        settings.update(new InstanceSettingsUpdate(null, mode, null, null, null, null));
    }

    private void activate(String email) {
        AuthTestUtils.activate(AuthTestUtils.findByEmail(email).getId());
    }

    @Test
    void inviteModeRejectsSignUpWithoutACode() {
        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("ann", "ann@example.com", "password", null));
        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("ann", "ann@example.com", "password", "not-a-code"));
    }

    @Test
    void aMultiUseCodeWorksUntilItRunsOut() {
        InviteCode code = inviteCodes.create(null, 2, null);

        AuthTestUtils.register("a", "a@example.com", "password", code.getCode());
        AuthTestUtils.register("b", "b@example.com", "password", code.getCode());

        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("c", "c@example.com", "password", code.getCode()));
    }

    @Test
    void revokedAndExpiredCodesAreRejected() {
        InviteCode revoked = inviteCodes.create(null, null, null);
        inviteCodes.revoke(revoked.getId());
        InviteCode expired = inviteCodes.create(null, null, Instant.now().minusSeconds(60));

        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("r", "r@example.com", "password", revoked.getCode()));
        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("x", "x@example.com", "password", expired.getCode()));
    }

    @Test
    void aMarginInviteLinkAlsoLetsANewcomerSignUp() {
        User owner = UserTestUtils.createUser("owner", "owner@example.com");
        Margin margin = MarginTestUtils.createMargin("Acme", owner);
        MarginInvite link = marginInvites.createLinkInvite(margin, null, owner.getId());

        assertDoesNotThrow(() -> AuthTestUtils.register("newbie", "newbie@example.com", "password", link.getInviteCode()));
    }

    @Test
    void openModeNeedsNoCodeAndClosedModeAllowsNone() {
        mode(RegistrationMode.OPEN);
        assertDoesNotThrow(() -> AuthTestUtils.register("o", "o@example.com", "password", null));

        mode(RegistrationMode.CLOSED);
        InviteCode code = inviteCodes.create(null, null, null);
        assertThrows(IllegalArgumentException.class,
                () -> AuthTestUtils.register("c", "c@example.com", "password", code.getCode()));
    }

    @Test
    void accountsWaitForApprovalWhenTheInstanceRequiresIt() {
        mode(RegistrationMode.OPEN);
        settings.update(new InstanceSettingsUpdate(null, null, null, null, true, null));

        AuthTestUtils.register("pat", "pat@example.com", "password", null);
        activate("pat@example.com");
        User pat = AuthTestUtils.findByEmail("pat@example.com");
        assertEquals(AccountStatus.PENDING_APPROVAL, pat.getStatus());

        AuthResponse beforeApproval = AuthTestUtils.login("pat@example.com", "password");
        assertFalse(beforeApproval.success());
        assertNull(beforeApproval.token());

        UserTestUtils.accountCommands().setStatus(pat.getId(), AccountStatus.ACTIVE);
        assertTrue(AuthTestUtils.login("pat@example.com", "password").success());
    }

    @Test
    void disabledAccountsCannotLogIn() {
        InviteCode code = inviteCodes.create(null, null, null);
        AuthTestUtils.registerAndActivate("dan", "dan@example.com", "password", code.getCode());
        User dan = AuthTestUtils.findByEmail("dan@example.com");

        UserTestUtils.accountCommands().setStatus(dan.getId(), AccountStatus.DISABLED);

        assertFalse(AuthTestUtils.login("dan@example.com", "password").success());
    }

    @Test
    void theSetupLinkCreatesTheFirstAdminOnce() {
        firstAdminSetup.onStartup();
        String token = firstAdminSetup.pendingSetupToken().orElseThrow();
        assertFalse(firstAdminSetup.isValidToken("wrong"));

        firstAdminSetup.completeSetup(token, "Root", "root@example.com", "password", "k", "p", "s", "i");

        User root = AuthTestUtils.findByEmail("root@example.com");
        assertEquals(Role.ADMIN, root.getRole());
        assertTrue(AuthTestUtils.login("root@example.com", "password").success(),
                "the first admin can log in straight away");
        assertTrue(firstAdminSetup.pendingSetupToken().isEmpty());
        assertThrows(IllegalArgumentException.class, () ->
                firstAdminSetup.completeSetup(token, "Again", "again@example.com", "password", "k", "p", "s", "i"));
    }

    @Test
    void noSetupLinkOnceAccountsExist() {
        UserTestUtils.createUser("someone", "someone@example.com");

        firstAdminSetup.onStartup();

        assertTrue(firstAdminSetup.pendingSetupToken().isEmpty());
    }
}
