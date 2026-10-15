@ApplicationModule(allowedDependencies = {
        "instance::api",
        "presence",
        "shared",
        "users::api",
        "users::events"
})
package org.margin.server.social;

import org.springframework.modulith.ApplicationModule;
