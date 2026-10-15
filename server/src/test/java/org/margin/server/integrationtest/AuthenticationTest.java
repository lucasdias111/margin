package org.margin.server.integrationtest;

import org.junit.jupiter.api.Test;
import org.margin.server.authentication.entities.InviteCode;
import org.margin.server.authentication.models.AuthResponse;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.integrationtest.utils.AuthTestUtils;
import org.margin.server.users.models.User;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class AuthenticationTest extends MarginTestRunner {

    @Test
    void loginWithValidCredentials_returnsTokenAndSuccess() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("alice", "alice@margin.chat", "correct-password", key.getCode());

        AuthResponse response = AuthTestUtils.login("alice@margin.chat", "correct-password");

        assertTrue(response.success());
        assertNotNull(response.token());
        assertEquals("Login successful", response.message());
    }

    @Test
    void loginWithWrongPassword_returnsFalse() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("bob", "bob@margin.chat", "correct-password", key.getCode());

        AuthResponse response = AuthTestUtils.login("bob@margin.chat", "wrong-password");

        assertFalse(response.success());
        assertNull(response.token());
    }

    @Test
    void loginWithUnknownEmail_returnsFalse() {
        AuthResponse response = AuthTestUtils.login("nobody@margin.chat", "password");

        assertFalse(response.success());
        assertNull(response.token());
    }

    @Test
    void loginIsCaseInsensitiveForEmail() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("carol", "carol@margin.chat", "password123", key.getCode());

        AuthResponse response = AuthTestUtils.login("CAROL@MARGIN.CHAT", "password123");

        assertTrue(response.success());
        assertNotNull(response.token());
    }

    @Test
    void failedLoginIncrementsAttemptCounter() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("dave", "dave@margin.chat", "correct", key.getCode());

        AuthTestUtils.login("dave@margin.chat", "wrong");

        User user = AuthTestUtils.findByEmail("dave@margin.chat");
        assertEquals(1, AuthTestUtils.securityOf(user).getFailedLoginAttempts());
    }

    @Test
    void accountLocksAfterThreeFailedAttempts() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("eve", "eve@margin.chat", "correct", key.getCode());

        AuthTestUtils.login("eve@margin.chat", "wrong");
        AuthTestUtils.login("eve@margin.chat", "wrong");
        AuthTestUtils.login("eve@margin.chat", "wrong");

        User user = AuthTestUtils.findByEmail("eve@margin.chat");
        assertNotNull(AuthTestUtils.securityOf(user).getAccountLockedUntil());
        assertTrue(AuthTestUtils.securityOf(user).getAccountLockedUntil().isAfter(java.time.Instant.now()));
    }

    @Test
    void lockedAccountRejectsLoginEvenWithCorrectPassword() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("frank", "frank@margin.chat", "correct", key.getCode());

        AuthTestUtils.login("frank@margin.chat", "wrong");
        AuthTestUtils.login("frank@margin.chat", "wrong");
        AuthTestUtils.login("frank@margin.chat", "wrong");

        AuthResponse response = AuthTestUtils.login("frank@margin.chat", "correct");

        assertFalse(response.success());
        assertNull(response.token());
    }

    @Test
    void successfulLoginResetsFailedAttemptCounter() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.registerAndActivate("grace", "grace@margin.chat", "correct", key.getCode());

        AuthTestUtils.login("grace@margin.chat", "wrong");
        AuthTestUtils.login("grace@margin.chat", "wrong");
        AuthTestUtils.login("grace@margin.chat", "correct");

        User user = AuthTestUtils.findByEmail("grace@margin.chat");
        assertEquals(0, AuthTestUtils.securityOf(user).getFailedLoginAttempts());
        assertNull(AuthTestUtils.securityOf(user).getAccountLockedUntil());
    }

    @Test
    void registerWithValidInviteCode_persistsUser() {
        InviteCode key = AuthTestUtils.createInviteCode();

        AuthTestUtils.register("henry", "henry@margin.chat", "password", key.getCode());

        User user = AuthTestUtils.findByEmail("henry@margin.chat");
        assertNotNull(user);
        assertEquals("henry", user.getDisplayName());
    }

    @Test
    void registerWithValidInviteCode_loginRequiresActivation() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.register("henrietta", "henrietta@margin.chat", "password", key.getCode());

        AuthResponse response = AuthTestUtils.login("henrietta@margin.chat", "password");

        assertFalse(response.success());
        assertNull(response.token());
    }

    @Test
    void registerUsesUpTheInviteCode() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.register("ivan", "ivan@margin.chat", "password", key.getCode());

        assertEquals(1, AuthTestUtils.inviteCode(key.getCode()).getUseCount());
        assertThrows(IllegalArgumentException.class, () ->
                AuthTestUtils.register("ivan2", "ivan2@margin.chat", "password", key.getCode()),
                "a single-use code can't be redeemed twice");
    }

    @Test
    void registerWithDuplicateEmail_throws() {
        InviteCode key1 = AuthTestUtils.createInviteCode();
        InviteCode key2 = AuthTestUtils.createInviteCode();
        AuthTestUtils.register("lara", "lara@margin.chat", "password", key1.getCode());

        assertThrows(IllegalArgumentException.class, () ->
                AuthTestUtils.register("lara2", "lara@margin.chat", "password", key2.getCode()));
    }

    @Test
    void registerEmailIsStoredLowercase() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.register("Nina", "NinaUpper@Margin.chat", "password", key.getCode());

        User user = AuthTestUtils.findByEmail("ninaupper@margin.chat");
        assertEquals("ninaupper@margin.chat", user.getEmail());
    }

    @Test
    void registerPasswordIsNotStoredInPlaintext() {
        InviteCode key = AuthTestUtils.createInviteCode();
        AuthTestUtils.register("oscar", "oscar@margin.chat", "my-secret", key.getCode());

        User user = AuthTestUtils.findByEmail("oscar@margin.chat");
        assertNotEquals("my-secret", user.getPassword());
        assertTrue(user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$"));
    }
}
