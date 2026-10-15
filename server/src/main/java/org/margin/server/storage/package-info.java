@ApplicationModule(allowedDependencies = {
        "presence",
        "shared",
        "social::api",
        "social::events",
        "users::api"
})
package org.margin.server.storage;

import org.springframework.modulith.ApplicationModule;
