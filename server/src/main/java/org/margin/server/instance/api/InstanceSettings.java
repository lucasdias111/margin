package org.margin.server.instance.api;

/**
 * Instance-wide settings an admin can change at runtime. Values live in the database; the
 * environment only seeds them the first time the instance starts.
 */
public interface InstanceSettings {

    String instanceName();

    RegistrationMode registrationMode();

    MarginCreationPolicy marginCreationPolicy();

    /** Whether new accounts must confirm their email. Always false when mail isn't configured. */
    boolean requireEmailVerification();

    boolean requireAccountApproval();

    /** Maximum people in one SFU room; {@code 0} means unlimited. */
    int maxCallParticipants();

    boolean mailEnabled();
}
