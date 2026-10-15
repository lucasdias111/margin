package org.margin.server.notifications.push;

public enum PushPlatform {
    ANDROID,
    IOS,
    /** A browser Push API subscription (JSON with endpoint, p256dh and auth). */
    WEB
}
