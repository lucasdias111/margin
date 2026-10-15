@ApplicationModule(allowedDependencies = {
        "presence",
        "shared",
        "social::api",
        "social::conversation-dtos",
        "social::events",
        "users::api"
})
package org.margin.server.notifications;

import org.springframework.modulith.ApplicationModule;
