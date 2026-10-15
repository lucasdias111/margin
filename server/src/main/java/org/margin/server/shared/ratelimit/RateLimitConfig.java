package org.margin.server.shared.ratelimit;

import io.github.bucket4j.Bandwidth;

import java.time.Duration;

public final class RateLimitConfig {

    private RateLimitConfig() {
    }

    public static Bandwidth createMargin() {
        return Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofHours(1))
                .build();
    }

    /** Per client address, so a stranger can't lock someone out by guessing at their account. */
    public static Bandwidth login() {
        return Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofMinutes(15))
                .build();
    }

    /** Looking up or redeeming invite codes and links, so codes can't be brute-forced. */
    public static Bandwidth inviteRedemption() {
        return Bandwidth.builder()
                .capacity(20)
                .refillGreedy(20, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth register() {
        return Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth forgotPassword() {
        return Bandwidth.builder()
                .capacity(3)
                .refillGreedy(3, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth resetPassword() {
        return Bandwidth.builder()
                .capacity(5)
                .refillGreedy(5, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth uploadImage() {
        return Bandwidth.builder()
                .capacity(3)
                .refillGreedy(3, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth sendInvite() {
        return Bandwidth.builder()
                .capacity(20)
                .refillGreedy(20, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth guestSession() {
        return Bandwidth.builder()
                .capacity(10)
                .refillGreedy(10, Duration.ofHours(1))
                .build();
    }

    public static Bandwidth meetingPreview() {
        return Bandwidth.builder()
                .capacity(30)
                .refillGreedy(30, Duration.ofHours(1))
                .build();
    }
}
