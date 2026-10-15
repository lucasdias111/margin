package org.margin.server.users.api;

public enum AccountStatus {
    ACTIVE,
    /** Signed up while the instance requires admin approval; can't log in yet. */
    PENDING_APPROVAL,
    /** Turned off by an admin; can't log in. */
    DISABLED
}
