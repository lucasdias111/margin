@ApplicationModule(allowedDependencies = {
        "email",
        "notifications::api",
        "presence",
        "shared",
        "sfu::api",
        "sfu::events",
        "social::api",
        "users::api"
})
package org.margin.server.meetings;

import org.springframework.modulith.ApplicationModule;
