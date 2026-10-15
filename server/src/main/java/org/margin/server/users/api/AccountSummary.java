package org.margin.server.users.api;

import java.time.Instant;

/** An account as an instance admin sees it. */
public record AccountSummary(Long id,
                             String displayName,
                             String email,
                             Role role,
                             AccountStatus status,
                             Instant createdAt,
                             Instant lastSeenAt) {
}
