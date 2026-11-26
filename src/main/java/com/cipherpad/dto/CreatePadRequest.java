package com.cipherpad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePadRequest {

    @NotBlank(message = "Encrypted title is required")
    @Size(max = 10000, message = "Encrypted title too large")
    private String encryptedTitle;

    @NotBlank(message = "Ciphertext is required")
    @Size(max = 2000000, message = "Ciphertext too large")
    private String ciphertext;

    @NotBlank(message = "Salt is required")
    @Size(max = 64, message = "Salt too large")
    private String salt;

    @NotBlank(message = "IV is required")
    @Size(max = 64, message = "IV too large")
    private String iv;

    @NotBlank(message = "Title IV is required")
    @Size(max = 64, message = "Title IV too large")
    private String titleIv;

    @NotBlank(message = "KDF algorithm is required")
    private String kdfAlgorithm;

    @NotNull(message = "KDF iterations are required")
    private Integer kdfIterations;
}
