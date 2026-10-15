package org.margin.server.sfu.services;

import org.margin.server.instance.api.InstanceSettings;
import org.springframework.http.HttpStatus;
import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * How many people an SFU room (channel voice or meeting) may hold, from the instance's
 * "max call participants" setting. 1:1 calls don't go through the SFU and aren't capped.
 */
@Component
@NamedInterface("api")
public class CallCapacity {

    private final InstanceSettings settings;

    public CallCapacity(InstanceSettings settings) {
        this.settings = settings;
    }

    public int maxParticipants() {
        int configured = settings.maxCallParticipants();
        return configured <= 0 ? Integer.MAX_VALUE : configured;
    }

    public int requireRoomFor(int currentParticipants) {
        int max = maxParticipants();
        if (currentParticipants >= max) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Call is full");
        }
        return max;
    }
}
