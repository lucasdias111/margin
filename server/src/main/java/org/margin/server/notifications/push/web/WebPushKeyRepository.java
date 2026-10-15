package org.margin.server.notifications.push.web;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebPushKeyRepository extends JpaRepository<WebPushKey, Short> {
}
