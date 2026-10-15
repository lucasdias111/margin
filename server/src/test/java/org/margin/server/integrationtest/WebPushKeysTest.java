package org.margin.server.integrationtest;

import org.junit.jupiter.api.Test;
import org.margin.server.integrationtest.config.MarginTestRunner;
import org.margin.server.notifications.push.web.VapidKeys;
import org.margin.server.notifications.push.web.WebPushCrypto;
import org.margin.server.notifications.push.web.WebPushKeyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WebPushKeysTest extends MarginTestRunner {

    @Autowired
    private VapidKeys vapidKeys;

    @Autowired
    private WebPushKeyRepository repository;

    @Test
    void theInstanceKeepsOneVapidKeyPair() throws Exception {
        String first = vapidKeys.publicKey();
        String second = vapidKeys.publicKey();

        assertEquals(first, second, "subscriptions break if the key changes");
        assertEquals(1, repository.count(), "stored, so backups and restarts keep it");
        assertEquals(first, repository.findAll().getFirst().getPublicKey());
        assertNotNull(WebPushCrypto.publicKeyFrom(WebPushCrypto.fromBase64Url(first)));
    }
}
