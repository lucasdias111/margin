package org.margin.server.instance.controllers;

import org.margin.server.instance.api.MarginCreationPolicy;
import org.margin.server.instance.api.RegistrationMode;
import org.margin.server.instance.services.InstanceSettingsService;
import org.margin.server.instance.services.InstanceSettingsService.InstanceSettingsUpdate;
import org.margin.server.shared.security.AuthenticatedUser;
import org.margin.server.users.api.AdminAccess;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingsController {

    private final InstanceSettingsService settings;
    private final AdminAccess adminAccess;

    public AdminSettingsController(InstanceSettingsService settings, AdminAccess adminAccess) {
        this.settings = settings;
        this.adminAccess = adminAccess;
    }

    @GetMapping
    public SettingsView get(@AuthenticationPrincipal AuthenticatedUser user) {
        adminAccess.requireAdmin(user.id());
        return view();
    }

    @PatchMapping
    public SettingsView update(@RequestBody InstanceSettingsUpdate update,
                               @AuthenticationPrincipal AuthenticatedUser user) {
        adminAccess.requireAdmin(user.id());
        try {
            settings.update(update);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return view();
    }

    private SettingsView view() {
        return new SettingsView(settings.instanceName(), settings.registrationMode(), settings.marginCreationPolicy(),
                settings.requireEmailVerification(), settings.requireAccountApproval(),
                settings.maxCallParticipants(), settings.mailEnabled());
    }

    public record SettingsView(String instanceName,
                               RegistrationMode registrationMode,
                               MarginCreationPolicy marginCreationPolicy,
                               boolean requireEmailVerification,
                               boolean requireAccountApproval,
                               int maxCallParticipants,
                               boolean mailEnabled) {
    }
}
