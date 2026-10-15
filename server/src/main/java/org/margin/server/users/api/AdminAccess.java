package org.margin.server.users.api;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Guards the instance-admin endpoints. */
@Component
public class AdminAccess {

    private final UserLookup userLookup;

    public AdminAccess(UserLookup userLookup) {
        this.userLookup = userLookup;
    }

    public void requireAdmin(Long userId) {
        if (!userLookup.isAdmin(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Instance admins only");
        }
    }
}
