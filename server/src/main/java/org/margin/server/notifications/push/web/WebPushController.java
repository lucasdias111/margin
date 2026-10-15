package org.margin.server.notifications.push.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebPushController {

    private final VapidKeys vapidKeys;

    public WebPushController(VapidKeys vapidKeys) {
        this.vapidKeys = vapidKeys;
    }

    /** The key a browser passes as {@code applicationServerKey} when subscribing. */
    @GetMapping("/api/push/web/public-key")
    public PublicKey publicKey() {
        return new PublicKey(vapidKeys.publicKey());
    }

    public record PublicKey(String publicKey) {
    }
}
