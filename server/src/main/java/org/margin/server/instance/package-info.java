@ApplicationModule(allowedDependencies = {
        "shared",
        "users::api"
})
package org.margin.server.instance;

import org.springframework.modulith.ApplicationModule;
