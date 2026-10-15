package org.margin.server.integrationtest.utils;

import org.margin.server.authentication.entities.ActivationKey;
import org.margin.server.authentication.entities.InviteCode;
import org.margin.server.authentication.entities.UserSecurity;
import org.margin.server.authentication.models.AuthResponse;
import org.margin.server.authentication.repositories.ActivationKeyRepository;
import org.margin.server.authentication.repositories.InviteCodeRepository;
import org.margin.server.authentication.services.InviteCodeService;
import org.margin.server.authentication.services.ActivationKeyService;
import org.margin.server.authentication.services.UserSecurityService;
import org.margin.server.authentication.services.AuthenticationService;
import org.margin.server.users.models.User;
import org.margin.server.users.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


@Component
public class AuthTestUtils {

    private static AuthenticationService authenticationService;
    private static InviteCodeService inviteCodeService;
    private static InviteCodeRepository inviteCodeRepository;
    private static UserRepository userRepository;
    private static ActivationKeyService activationKeyService;
    private static UserSecurityService userSecurityService;
    private static ActivationKeyRepository activationKeyRepository;

    @Autowired
    public AuthTestUtils(AuthenticationService authenticationService,
                         InviteCodeService inviteCodeService,
                         InviteCodeRepository inviteCodeRepository,
                         UserRepository userRepository,
                         ActivationKeyService activationKeyService,
                         UserSecurityService userSecurityService,
                         ActivationKeyRepository activationKeyRepository) {
        AuthTestUtils.activationKeyRepository = activationKeyRepository;
        AuthTestUtils.authenticationService = authenticationService;
        AuthTestUtils.inviteCodeService = inviteCodeService;
        AuthTestUtils.inviteCodeRepository = inviteCodeRepository;
        AuthTestUtils.userRepository = userRepository;
        AuthTestUtils.activationKeyService = activationKeyService;
        AuthTestUtils.userSecurityService = userSecurityService;
    }

    public static InviteCode createInviteCode() {
        return inviteCodeService.create(null, 1, null);
    }

    public static InviteCode inviteCode(String code) {
        return inviteCodeRepository.findAll().stream()
                .filter(invite -> invite.getCode().equals(code))
                .findFirst()
                .orElseThrow();
    }

    public static ActivationKey register(String displayName, String email, String password, String inviteCode) {
        return authenticationService.registerUser(
                displayName, email, password,
                "enc-private-key", "public-key", "salt", "iv", inviteCode, null);
    }

    public static void registerAndActivate(String displayName, String email, String password, String inviteCode) {
        ActivationKey activationKey = register(displayName, email, password, inviteCode);
        activationKeyService.findAndConsumeActivationKey(activationKey.getToken());
    }

    public static void activate(Long userId) {
        ActivationKey key = activationKeyRepository.findActivationKeyByUserId(userId).orElseThrow();
        activationKeyService.findAndConsumeActivationKey(key.getToken());
    }

    public static AuthResponse login(String email, String password) {
        return authenticationService.authenticateUser(email, password);
    }

    public static User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase()).orElseThrow();
    }

    public static UserSecurity securityOf(User user) {
        return userSecurityService.get(user.getId());
    }
}
