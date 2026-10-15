@ApplicationModule(allowedDependencies = {
        "instance::api",
        "presence",
        "shared",
        "social::api",
        "users::api"
})
package org.margin.server.sfu;

import org.springframework.modulith.ApplicationModule;
