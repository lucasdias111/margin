package org.margin.server.instance.models;

import org.margin.server.instance.api.RegistrationMode;

/** What any client may learn about an instance before signing in. */
public record InstanceInfo(String name,
                           String version,
                           String publicUrl,
                           RegistrationMode registrationMode,
                           boolean mailEnabled,
                           Features features) {

    public record Features(boolean gifs) {
    }
}
