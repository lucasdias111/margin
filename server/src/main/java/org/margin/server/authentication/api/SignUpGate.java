package org.margin.server.authentication.api;

import org.margin.server.authentication.services.InviteCodeService;
import org.margin.server.instance.api.InstanceSettings;
import org.margin.server.social.api.MarginLookup;
import org.margin.server.users.api.AccountStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * The instance's rules for anyone creating an account, whether through the sign-up form or by
 * turning a meeting guest profile into a full account.
 */
@Component
public class SignUpGate {

    private final InstanceSettings instanceSettings;
    private final InviteCodeService inviteCodeService;
    private final MarginLookup marginLookup;

    public SignUpGate(InstanceSettings instanceSettings, InviteCodeService inviteCodeService, MarginLookup marginLookup) {
        this.instanceSettings = instanceSettings;
        this.inviteCodeService = inviteCodeService;
        this.marginLookup = marginLookup;
    }

    /**
     * Throws if the registration mode doesn't allow a new account. In invite-only mode an instance
     * invite code is used up; a margin's own invite link counts too, so margin owners can onboard
     * their team.
     */
    @Transactional
    public void requireSignUpAllowed(String inviteCode) {
        switch (instanceSettings.registrationMode()) {
            case OPEN -> {
            }
            case CLOSED -> throw new SignUpNotAllowedException("Sign-up is closed on this instance");
            case INVITE -> {
                boolean invited = marginLookup.isUsableLinkInvite(inviteCode) || inviteCodeService.redeem(inviteCode);
                if (!invited) {
                    throw new SignUpNotAllowedException("A valid invite code is required to sign up");
                }
            }
        }
    }

    /** New accounts wait for an admin when the instance requires approval. */
    public AccountStatus initialStatus() {
        return instanceSettings.requireAccountApproval() ? AccountStatus.PENDING_APPROVAL : AccountStatus.ACTIVE;
    }

    public static class SignUpNotAllowedException extends IllegalArgumentException {
        public SignUpNotAllowedException(String message) {
            super(message);
        }
    }
}
