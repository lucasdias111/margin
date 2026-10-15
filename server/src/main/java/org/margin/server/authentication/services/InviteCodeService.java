package org.margin.server.authentication.services;

import org.margin.server.authentication.entities.InviteCode;
import org.margin.server.authentication.repositories.InviteCodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InviteCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final InviteCodeRepository repository;

    public InviteCodeService(InviteCodeRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public InviteCode create(Long createdByUserId, Integer maxUses, Instant expiresAt) {
        if (maxUses != null && maxUses < 1) {
            throw new IllegalArgumentException("Max uses must be at least 1");
        }
        InviteCode invite = new InviteCode();
        invite.setCode(newCode());
        invite.setMaxUses(maxUses);
        invite.setExpiresAt(expiresAt);
        invite.setCreatedByUserId(createdByUserId);
        invite.setCreatedAt(Instant.now());
        return repository.save(invite);
    }

    @Transactional
    public void revoke(Long inviteCodeId) {
        InviteCode invite = repository.findById(inviteCodeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite code not found"));
        if (invite.getRevokedAt() == null) {
            invite.setRevokedAt(Instant.now());
            repository.save(invite);
        }
    }

    @Transactional(readOnly = true)
    public List<InviteCode> list() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    /** Uses up one redemption of {@code code}; returns false if it doesn't exist or can't be used. */
    @Transactional
    public boolean redeem(String code) {
        if (code == null || code.isBlank()) {
            return false;
        }
        return repository.findByCode(code.trim())
                .filter(invite -> invite.isUsable(Instant.now()))
                .map(invite -> {
                    invite.setUseCount(invite.getUseCount() + 1);
                    repository.save(invite);
                    return true;
                })
                .orElse(false);
    }

    private static String newCode() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
