package org.margin.server.instance.services;

import org.margin.server.instance.api.InstanceSettings;
import org.margin.server.instance.api.MarginCreationPolicy;
import org.margin.server.instance.api.RegistrationMode;
import org.margin.server.instance.entities.InstanceSetting;
import org.margin.server.instance.repositories.InstanceSettingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InstanceSettingsService implements InstanceSettings {

    static final String NAME = "instance_name";
    static final String REGISTRATION_MODE = "registration_mode";
    static final String MARGIN_CREATION = "margin_creation";
    static final String REQUIRE_EMAIL_VERIFICATION = "require_email_verification";
    static final String REQUIRE_ACCOUNT_APPROVAL = "require_account_approval";
    static final String MAX_CALL_PARTICIPANTS = "max_call_participants";

    private final InstanceSettingRepository repository;
    private final Map<String, String> seeds;
    private final boolean mailEnabled;
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public InstanceSettingsService(InstanceSettingRepository repository,
                                   @Value("${margin.app.base-url:http://localhost:8080}") String baseUrl,
                                   @Value("${margin.instance.name:}") String name,
                                   @Value("${margin.instance.registration-mode:INVITE}") RegistrationMode registrationMode,
                                   @Value("${margin.instance.margin-creation:EVERYONE}") MarginCreationPolicy marginCreation,
                                   @Value("${margin.instance.require-email-verification:true}") boolean requireEmailVerification,
                                   @Value("${margin.instance.require-account-approval:false}") boolean requireApproval,
                                   @Value("${margin.instance.max-call-participants:0}") int maxCallParticipants,
                                   @Value("${spring.mail.host:}") String mailHost) {
        this.repository = repository;
        this.mailEnabled = !mailHost.isBlank();
        this.seeds = Map.of(
                NAME, name.isBlank() ? hostOf(baseUrl) : name,
                REGISTRATION_MODE, registrationMode.name(),
                MARGIN_CREATION, marginCreation.name(),
                REQUIRE_EMAIL_VERIFICATION, String.valueOf(requireEmailVerification),
                REQUIRE_ACCOUNT_APPROVAL, String.valueOf(requireApproval),
                MAX_CALL_PARTICIPANTS, String.valueOf(Math.max(0, maxCallParticipants)));
    }

    @Override
    public String instanceName() {
        return value(NAME);
    }

    @Override
    public RegistrationMode registrationMode() {
        return RegistrationMode.valueOf(value(REGISTRATION_MODE));
    }

    @Override
    public MarginCreationPolicy marginCreationPolicy() {
        return MarginCreationPolicy.valueOf(value(MARGIN_CREATION));
    }

    @Override
    public boolean requireEmailVerification() {
        return mailEnabled && Boolean.parseBoolean(value(REQUIRE_EMAIL_VERIFICATION));
    }

    @Override
    public boolean requireAccountApproval() {
        return Boolean.parseBoolean(value(REQUIRE_ACCOUNT_APPROVAL));
    }

    @Override
    public int maxCallParticipants() {
        return Integer.parseInt(value(MAX_CALL_PARTICIPANTS));
    }

    @Override
    public boolean mailEnabled() {
        return mailEnabled;
    }

    @Transactional
    public void update(InstanceSettingsUpdate update) {
        if (update.instanceName() != null) {
            String trimmed = update.instanceName().trim();
            if (trimmed.isEmpty() || trimmed.length() > 64) {
                throw new IllegalArgumentException("Instance name must be 1-64 characters");
            }
            write(NAME, trimmed);
        }
        if (update.registrationMode() != null) {
            write(REGISTRATION_MODE, update.registrationMode().name());
        }
        if (update.marginCreationPolicy() != null) {
            write(MARGIN_CREATION, update.marginCreationPolicy().name());
        }
        if (update.requireEmailVerification() != null) {
            write(REQUIRE_EMAIL_VERIFICATION, update.requireEmailVerification().toString());
        }
        if (update.requireAccountApproval() != null) {
            write(REQUIRE_ACCOUNT_APPROVAL, update.requireAccountApproval().toString());
        }
        if (update.maxCallParticipants() != null) {
            if (update.maxCallParticipants() < 0) {
                throw new IllegalArgumentException("Max call participants cannot be negative");
            }
            write(MAX_CALL_PARTICIPANTS, update.maxCallParticipants().toString());
        }
    }

    /** The stored value, falling back to (and persisting) the environment seed the first time. */
    private String value(String key) {
        return cache.computeIfAbsent(key, k -> repository.findById(k)
                .map(InstanceSetting::getValue)
                .orElseGet(() -> repository.save(new InstanceSetting(k, seeds.get(k))).getValue()));
    }

    private void write(String key, String value) {
        InstanceSetting setting = repository.findById(key).orElseGet(() -> new InstanceSetting(key, value));
        setting.setValue(value);
        setting.setUpdatedAt(Instant.now());
        repository.save(setting);
        cache.put(key, value);
    }

    private static String hostOf(String baseUrl) {
        String host = URI.create(baseUrl).getHost();
        return host == null ? "margin" : host;
    }

    public record InstanceSettingsUpdate(String instanceName,
                                         RegistrationMode registrationMode,
                                         MarginCreationPolicy marginCreationPolicy,
                                         Boolean requireEmailVerification,
                                         Boolean requireAccountApproval,
                                         Integer maxCallParticipants) {
    }
}
