package org.margin.server.authentication.models;

public record SetupRequest(
        String token,
        String displayName,
        String email,
        String password,
        String publicKey,
        String encryptedPrivateKey,
        String salt,
        String iv
) {
}
