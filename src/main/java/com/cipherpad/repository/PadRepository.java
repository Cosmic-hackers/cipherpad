package com.cipherpad.repository;

import com.cipherpad.entity.Pad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PadRepository extends JpaRepository<Pad, UUID> {
    Optional<Pad> findByIdAndAccessTokenHash(UUID id, String accessTokenHash);
}
