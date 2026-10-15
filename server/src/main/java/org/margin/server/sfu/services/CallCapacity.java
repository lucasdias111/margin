package org.margin.server.sfu.services;

import org.springframework.http.HttpStatus;
import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * How many people an SFU room (channel voice or meeting) may hold. Unlimited until the
 * instance-level "max call participants" setting exists.
 */
@Component
@NamedInterface("api")
public class CallCapacity {

    public int maxParticipants() {
        return Integer.MAX_VALUE;
    }

    public int requireRoomFor(int currentParticipants) {
        int max = maxParticipants();
        if (currentParticipants >= max) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Call is full");
        }
        return max;
    }
}
