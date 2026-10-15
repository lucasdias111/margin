package org.margin.server.instance.controllers;

import org.margin.server.instance.api.InstanceSettings;
import org.margin.server.instance.models.InstanceInfo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/instance")
public class InstanceController {

    private final InstanceSettings settings;
    private final String version;
    private final String publicUrl;
    private final boolean gifsEnabled;

    public InstanceController(InstanceSettings settings,
                              @Value("${margin.version:dev}") String version,
                              @Value("${margin.app.base-url:http://localhost:8080}") String publicUrl,
                              @Value("${margin.gifs.klipy-api-key:}") String klipyApiKey) {
        this.settings = settings;
        this.version = version;
        this.publicUrl = publicUrl;
        this.gifsEnabled = !klipyApiKey.isBlank();
    }

    @GetMapping
    public InstanceInfo info() {
        return new InstanceInfo(
                settings.instanceName(),
                version,
                publicUrl,
                settings.registrationMode(),
                settings.mailEnabled(),
                new InstanceInfo.Features(gifsEnabled));
    }
}
