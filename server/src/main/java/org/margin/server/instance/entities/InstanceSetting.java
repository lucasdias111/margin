package org.margin.server.instance.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "instance_settings")
@Getter
@Setter
@NoArgsConstructor
public class InstanceSetting {

    @Id
    @Column(name = "key", length = 64)
    private String key;

    @Column(name = "value", nullable = false)
    private String value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public InstanceSetting(String key, String value) {
        this.key = key;
        this.value = value;
        this.updatedAt = Instant.now();
    }
}
