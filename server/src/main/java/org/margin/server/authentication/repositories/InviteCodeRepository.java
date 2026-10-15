package org.margin.server.authentication.repositories;

import org.margin.server.authentication.entities.InviteCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface InviteCodeRepository extends JpaRepository<InviteCode, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InviteCode> findByCode(String code);

    List<InviteCode> findAllByOrderByCreatedAtDesc();
}
