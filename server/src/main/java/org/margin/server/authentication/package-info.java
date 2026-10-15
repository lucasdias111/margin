@ApplicationModule(allowedDependencies = {
        "email",
        "email::events",
        "instance::api",
        "shared",
        "social::api",
        "users::api",
        "users::events",
        "users::identity"
})
package org.margin.server.authentication;

import org.springframework.modulith.ApplicationModule;
