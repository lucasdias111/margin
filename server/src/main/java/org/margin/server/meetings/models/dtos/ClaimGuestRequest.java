package org.margin.server.meetings.models.dtos;

public record ClaimGuestRequest(
        String email,
        String password,
        String publicKey,
        String encryptedPrivateKey,
        String salt,
        String iv,
        /** Needed when the instance is invite-only: an instance invite code or a margin invite link. */
        String inviteCode
) {
}
