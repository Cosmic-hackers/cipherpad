package com.cipherpad.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pads")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "encrypted_title", nullable = false, columnDefinition = "TEXT")
    private String encryptedTitle;

    @Column(name = "ciphertext", nullable = false, columnDefinition = "TEXT")
    private String ciphertext;

    @Column(name = "salt", nullable = false, length = 64)
    private String salt;

    @Column(name = "iv", nullable = false, length = 64)
    private String iv;

    @Column(name = "title_iv", nullable = false, length = 64)
    private String titleIv;

    @Column(name = "kdf_algorithm", nullable = false, length = 32)
    private String kdfAlgorithm;

    @Column(name = "kdf_iterations", nullable = false)
    private Integer kdfIterations;

    @Column(name = "access_token_hash", nullable = false, length = 128)
    private String accessTokenHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
