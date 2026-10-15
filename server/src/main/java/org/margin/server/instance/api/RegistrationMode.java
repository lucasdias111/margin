package org.margin.server.instance.api;

public enum RegistrationMode {
    /** Anyone who can reach the instance may sign up. */
    OPEN,
    /** Sign-up needs an instance invite code or a margin invite link. */
    INVITE,
    /** Only admins create accounts. */
    CLOSED
}
