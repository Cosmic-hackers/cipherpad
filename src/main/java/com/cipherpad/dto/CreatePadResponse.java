package com.cipherpad.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CreatePadResponse {
    private UUID id;
    private String accessToken;
    private String encryptedTitle;
    private String ciphertext;
    private String salt;
    private String iv;
    private String titleIv;
    private String kdfAlgorithm;
    private Integer kdfIterations;
}
