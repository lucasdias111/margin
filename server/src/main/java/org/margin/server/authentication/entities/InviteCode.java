package org.margin.server.authentication.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** An admin-issued code that lets someone sign up while registration is invite-only. */
@Entity
@Table(name = "invite_codes")
@Getter
@Setter
@NoArgsConstructor
public class InviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    /** {@code null} means unlimited. */
    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "use_count", nullable = false)
    private int useCount = 0;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public boolean isUsable(Instant now) {
        return revokedAt == null
                && (expiresAt == null || expiresAt.isAfter(now))
                && (maxUses == null || useCount < maxUses);
    }
}
