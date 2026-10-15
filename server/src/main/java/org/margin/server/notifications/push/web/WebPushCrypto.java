package org.margin.server.notifications.push.web;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;

/**
 * The cryptography Web Push needs, on plain JDK primitives: P-256 keys, message encryption
 * (RFC 8291, "aes128gcm" content encoding, RFC 8188) and VAPID authorization (RFC 8292).
 */
public final class WebPushCrypto {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int RECORD_SIZE = 4096;
    private static final Base64.Encoder B64URL = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64URL_DECODER = Base64.getUrlDecoder();

    private WebPushCrypto() {
    }

    public static KeyPair newKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
            generator.initialize(new ECGenParameterSpec("secp256r1"), RANDOM);
            return generator.generateKeyPair();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("P-256 is unavailable", e);
        }
    }

    /** The 65-byte uncompressed point (0x04 || X || Y). */
    public static byte[] uncompressed(ECPublicKey key) {
        byte[] out = new byte[65];
        out[0] = 0x04;
        copyFixed(key.getW().getAffineX(), out, 1);
        copyFixed(key.getW().getAffineY(), out, 33);
        return out;
    }

    public static ECPublicKey publicKeyFrom(byte[] uncompressed) throws GeneralSecurityException {
        if (uncompressed.length != 65 || uncompressed[0] != 0x04) {
            throw new GeneralSecurityException("Not an uncompressed P-256 point");
        }
        ECPoint point = new ECPoint(
                new BigInteger(1, Arrays.copyOfRange(uncompressed, 1, 33)),
                new BigInteger(1, Arrays.copyOfRange(uncompressed, 33, 65)));
        ECParameterSpec params = ((ECPublicKey) newKeyPair().getPublic()).getParams();
        return (ECPublicKey) KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, params));
    }

    public static PrivateKey privateKeyFrom(byte[] pkcs8) throws GeneralSecurityException {
        return KeyFactory.getInstance("EC").generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
    }

    public static String base64Url(byte[] bytes) {
        return B64URL.encodeToString(bytes);
    }

    public static byte[] fromBase64Url(String value) {
        return B64URL_DECODER.decode(value.replace('+', '-').replace('/', '_').replace("=", ""));
    }

    /**
     * Encrypts {@code payload} for a subscription's {@code p256dh} key and {@code auth} secret,
     * returning the request body to POST with {@code Content-Encoding: aes128gcm}.
     */
    public static byte[] encrypt(byte[] payload, byte[] clientPublic, byte[] authSecret) throws GeneralSecurityException {
        KeyPair ephemeral = newKeyPair();
        byte[] serverPublic = uncompressed((ECPublicKey) ephemeral.getPublic());

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(ephemeral.getPrivate());
        agreement.doPhase(publicKeyFrom(clientPublic), true);
        byte[] sharedSecret = agreement.generateSecret();

        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);

        byte[][] keyAndNonce = deriveKeyAndNonce(sharedSecret, authSecret, clientPublic, serverPublic, salt);

        byte[] padded = Arrays.copyOf(payload, payload.length + 1);
        padded[payload.length] = 0x02; // delimiter: this is the last (and only) record

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyAndNonce[0], "AES"), new GCMParameterSpec(128, keyAndNonce[1]));
        byte[] ciphertext = cipher.doFinal(padded);

        return ByteBuffer.allocate(16 + 4 + 1 + serverPublic.length + ciphertext.length)
                .put(salt)
                .putInt(RECORD_SIZE)
                .put((byte) serverPublic.length)
                .put(serverPublic)
                .put(ciphertext)
                .array();
    }

    /** Content-encryption key (16 bytes) and nonce (12 bytes) per RFC 8291 section 3.4. */
    public static byte[][] deriveKeyAndNonce(byte[] sharedSecret, byte[] authSecret, byte[] clientPublic,
                                             byte[] serverPublic, byte[] salt) throws GeneralSecurityException {
        byte[] keyInfo = concat("WebPush: info\0".getBytes(StandardCharsets.US_ASCII), clientPublic, serverPublic);
        byte[] ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);
        byte[] cek = hkdf(salt, ikm, "Content-Encoding: aes128gcm\0".getBytes(StandardCharsets.US_ASCII), 16);
        byte[] nonce = hkdf(salt, ikm, "Content-Encoding: nonce\0".getBytes(StandardCharsets.US_ASCII), 12);
        return new byte[][]{cek, nonce};
    }

    /** {@code Authorization} header value for a push service at {@code audience} (scheme://host). */
    public static String vapidAuthorization(String audience, String subject, long expiresAtEpochSeconds,
                                            PrivateKey privateKey, byte[] publicKey) throws GeneralSecurityException {
        String header = base64Url("{\"typ\":\"JWT\",\"alg\":\"ES256\"}".getBytes(StandardCharsets.UTF_8));
        String claims = base64Url(("{\"aud\":\"" + audience + "\",\"exp\":" + expiresAtEpochSeconds
                + ",\"sub\":\"" + subject + "\"}").getBytes(StandardCharsets.UTF_8));
        String signingInput = header + "." + claims;

        Signature signer = Signature.getInstance("SHA256withECDSAinP1363Format");
        signer.initSign(privateKey);
        signer.update(signingInput.getBytes(StandardCharsets.US_ASCII));
        String jwt = signingInput + "." + base64Url(signer.sign());

        return "vapid t=" + jwt + ", k=" + base64Url(publicKey);
    }

    private static byte[] hkdf(byte[] salt, byte[] ikm, byte[] info, int length) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(salt, "HmacSHA256"));
        byte[] prk = mac.doFinal(ikm);
        mac.init(new SecretKeySpec(prk, "HmacSHA256"));
        byte[] okm = mac.doFinal(concat(info, new byte[]{0x01}));
        return Arrays.copyOf(okm, length);
    }

    private static byte[] concat(byte[]... parts) {
        int total = 0;
        for (byte[] part : parts) {
            total += part.length;
        }
        ByteBuffer buffer = ByteBuffer.allocate(total);
        for (byte[] part : parts) {
            buffer.put(part);
        }
        return buffer.array();
    }

    private static void copyFixed(BigInteger value, byte[] out, int offset) {
        byte[] bytes = value.toByteArray();
        int start = Math.max(0, bytes.length - 32);
        int length = Math.min(32, bytes.length);
        System.arraycopy(bytes, start, out, offset + 32 - length, length);
    }
}
