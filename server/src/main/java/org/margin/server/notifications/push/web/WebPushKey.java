package org.margin.server.notifications.push.web;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "web_push_keys")
@Getter
@Setter
@NoArgsConstructor
public class WebPushKey {

    @Id
    private Short id = 1;

    /** Uncompressed P-256 point, base64url without padding (what browsers call applicationServerKey). */
    @Column(name = "public_key", nullable = false)
    private String publicKey;

    /** PKCS#8, base64. */
    @Column(name = "private_key", nullable = false)
    private String privateKey;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
