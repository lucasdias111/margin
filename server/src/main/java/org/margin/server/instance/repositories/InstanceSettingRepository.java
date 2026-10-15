package org.margin.server.instance.repositories;

import org.margin.server.instance.entities.InstanceSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstanceSettingRepository extends JpaRepository<InstanceSetting, String> {
}
