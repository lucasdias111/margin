package org.margin.server.notifications.push.web;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.interfaces.ECPublicKey;
import java.time.Instant;
import java.util.Base64;

/** The instance's VAPID key pair: generated the first time it's needed and kept in the database. */
@Service
public class VapidKeys {

    private final WebPushKeyRepository repository;
    private volatile Loaded loaded;

    public VapidKeys(WebPushKeyRepository repository) {
        this.repository = repository;
    }

    /** base64url public key, for the browser's {@code applicationServerKey}. */
    public String publicKey() {
        return WebPushCrypto.base64Url(load().publicKey());
    }

    Loaded load() {
        Loaded current = loaded;
        if (current == null) {
            synchronized (this) {
                if (loaded == null) {
                    loaded = fromRow(repository.findById((short) 1).orElseGet(this::generate));
                }
                current = loaded;
            }
        }
        return current;
    }

    @Transactional
    protected WebPushKey generate() {
        KeyPair pair = WebPushCrypto.newKeyPair();
        WebPushKey row = new WebPushKey();
        row.setPublicKey(WebPushCrypto.base64Url(WebPushCrypto.uncompressed((ECPublicKey) pair.getPublic())));
        row.setPrivateKey(Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded()));
        row.setCreatedAt(Instant.now());
        return repository.save(row);
    }

    private static Loaded fromRow(WebPushKey row) {
        try {
            return new Loaded(WebPushCrypto.fromBase64Url(row.getPublicKey()),
                    WebPushCrypto.privateKeyFrom(Base64.getDecoder().decode(row.getPrivateKey())));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Stored VAPID key is unreadable", e);
        }
    }

    record Loaded(byte[] publicKey, PrivateKey privateKey) {
    }
}
