package org.margin.server.unittest;

import org.junit.jupiter.api.Test;
import org.margin.server.notifications.push.web.WebPushCrypto;

import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class WebPushCryptoTest {

    /** Decrypts like a browser's push client would, per RFC 8291. */
    private static String browserDecrypt(byte[] body, KeyPair browserKeys, byte[] authSecret) throws Exception {
        ByteBuffer buffer = ByteBuffer.wrap(body);
        byte[] salt = new byte[16];
        buffer.get(salt);
        assertEquals(4096, buffer.getInt(), "record size");
        byte[] serverPublic = new byte[buffer.get()];
        buffer.get(serverPublic);
        byte[] ciphertext = new byte[buffer.remaining()];
        buffer.get(ciphertext);

        KeyAgreement agreement = KeyAgreement.getInstance("ECDH");
        agreement.init(browserKeys.getPrivate());
        agreement.doPhase(WebPushCrypto.publicKeyFrom(serverPublic), true);
        byte[] browserPublic = WebPushCrypto.uncompressed((ECPublicKey) browserKeys.getPublic());
        byte[][] keyAndNonce = WebPushCrypto.deriveKeyAndNonce(
                agreement.generateSecret(), authSecret, browserPublic, serverPublic, salt);

        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(keyAndNonce[0], "AES"), new GCMParameterSpec(128, keyAndNonce[1]));
        byte[] padded = cipher.doFinal(ciphertext);
        assertEquals(0x02, padded[padded.length - 1], "last-record delimiter");
        return new String(Arrays.copyOf(padded, padded.length - 1), StandardCharsets.UTF_8);
    }

    @Test
    void aBrowserCanDecryptWhatWeEncrypt() throws Exception {
        KeyPair browserKeys = WebPushCrypto.newKeyPair();
        byte[] authSecret = new byte[16];
        new SecureRandom().nextBytes(authSecret);
        byte[] browserPublic = WebPushCrypto.uncompressed((ECPublicKey) browserKeys.getPublic());

        byte[] body = WebPushCrypto.encrypt(
                "{\"title\":\"Meeting\",\"body\":\"Starting now\"}".getBytes(StandardCharsets.UTF_8), browserPublic, authSecret);

        assertEquals("{\"title\":\"Meeting\",\"body\":\"Starting now\"}", browserDecrypt(body, browserKeys, authSecret));
    }

    @Test
    void eachMessageUsesFreshKeysAndSalt() throws Exception {
        KeyPair browserKeys = WebPushCrypto.newKeyPair();
        byte[] browserPublic = WebPushCrypto.uncompressed((ECPublicKey) browserKeys.getPublic());
        byte[] auth = new byte[16];

        byte[] first = WebPushCrypto.encrypt("same".getBytes(), browserPublic, auth);
        byte[] second = WebPushCrypto.encrypt("same".getBytes(), browserPublic, auth);

        assertFalse(Arrays.equals(first, second));
    }

    @Test
    void theVapidHeaderCarriesAVerifiableEs256Token() throws Exception {
        KeyPair vapid = WebPushCrypto.newKeyPair();
        byte[] publicKey = WebPushCrypto.uncompressed((ECPublicKey) vapid.getPublic());

        String header = WebPushCrypto.vapidAuthorization(
                "https://push.example.net", "https://chat.example.com", 1_900_000_000L, vapid.getPrivate(), publicKey);

        assertTrue(header.startsWith("vapid t="));
        String jwt = header.substring("vapid t=".length(), header.indexOf(", k="));
        assertEquals(WebPushCrypto.base64Url(publicKey), header.substring(header.indexOf(", k=") + 4));

        String[] parts = jwt.split("\\.");
        String claims = new String(WebPushCrypto.fromBase64Url(parts[1]), StandardCharsets.UTF_8);
        assertEquals("{\"aud\":\"https://push.example.net\",\"exp\":1900000000,\"sub\":\"https://chat.example.com\"}", claims);

        Signature verifier = Signature.getInstance("SHA256withECDSAinP1363Format");
        verifier.initVerify(WebPushCrypto.publicKeyFrom(publicKey));
        verifier.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII));
        assertTrue(verifier.verify(WebPushCrypto.fromBase64Url(parts[2])));
        assertEquals(64, WebPushCrypto.fromBase64Url(parts[2]).length, "raw R||S, as JWS requires");
    }

    @Test
    void publicKeysRoundTripThroughTheUncompressedForm() throws Exception {
        ECPublicKey key = (ECPublicKey) WebPushCrypto.newKeyPair().getPublic();

        byte[] encoded = WebPushCrypto.uncompressed(key);

        assertEquals(65, encoded.length);
        assertEquals(key.getW(), WebPushCrypto.publicKeyFrom(encoded).getW());
    }

    @Test
    void keyDerivationMatchesTheRfc8291TestVector() throws Exception {
        byte[][] keyAndNonce = WebPushCrypto.deriveKeyAndNonce(
                WebPushCrypto.fromBase64Url("kyrL1jIIOHEzg3sM2ZWRHDRB62YACZhhSlknJ672kSs"),
                WebPushCrypto.fromBase64Url("BTBZMqHH6r4Tts7J_aSIgg"),
                WebPushCrypto.fromBase64Url("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"),
                WebPushCrypto.fromBase64Url("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8"),
                WebPushCrypto.fromBase64Url("DGv6ra1nlYgDCS1FRnbzlw"));

        assertEquals("oIhVW04MRdy2XN9CiKLxTg", WebPushCrypto.base64Url(keyAndNonce[0]));
        assertEquals("4h_95klXJ5E_qnoN", WebPushCrypto.base64Url(keyAndNonce[1]));
    }
}
