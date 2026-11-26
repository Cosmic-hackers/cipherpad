package com.cipherpad.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PadResponse {
    private UUID id;
    private String encryptedTitle;
    private String ciphertext;
    private String salt;
    private String iv;
    private String titleIv;
    private String kdfAlgorithm;
    private Integer kdfIterations;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
