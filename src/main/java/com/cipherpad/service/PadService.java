package com.cipherpad.service;

import com.cipherpad.dto.*;
import com.cipherpad.entity.Pad;
import com.cipherpad.exception.PadNotFoundException;
import com.cipherpad.exception.UnauthorizedException;
import com.cipherpad.repository.PadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
public class PadService {

    private static final Logger log = LoggerFactory.getLogger(PadService.class);
    private final PadRepository padRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public PadService(PadRepository padRepository) {
        this.padRepository = padRepository;
    }

    @Transactional
    public CreatePadResponse createPad(CreatePadRequest request) {
        // Generate a random access token (256-bit)
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String accessToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        // Hash the token for storage
        String tokenHash = sha256Hex(accessToken);

        Pad pad = new Pad();
        pad.setEncryptedTitle(request.getEncryptedTitle());
        pad.setCiphertext(request.getCiphertext());
        pad.setSalt(request.getSalt());
        pad.setIv(request.getIv());
        pad.setTitleIv(request.getTitleIv());
        pad.setKdfAlgorithm(request.getKdfAlgorithm());
        pad.setKdfIterations(request.getKdfIterations());
        pad.setAccessTokenHash(tokenHash);

        Pad saved = padRepository.save(pad);
        log.info("Created pad with id={}", saved.getId());

        return CreatePadResponse.builder()
                .id(saved.getId())
                .accessToken(accessToken) // returned ONCE
                .encryptedTitle(saved.getEncryptedTitle())
                .ciphertext(saved.getCiphertext())
                .salt(saved.getSalt())
                .iv(saved.getIv())
                .titleIv(saved.getTitleIv())
                .kdfAlgorithm(saved.getKdfAlgorithm())
                .kdfIterations(saved.getKdfIterations())
                .build();
    }

    @Transactional(readOnly = true)
    public PadResponse getPad(UUID id, String accessToken) {
        String tokenHash = sha256Hex(accessToken);
        Pad pad = padRepository.findByIdAndAccessTokenHash(id, tokenHash)
                .orElseThrow(() -> new PadNotFoundException("Note not found or invalid access token"));

        return toPadResponse(pad);
    }

    @Transactional
    public PadResponse updatePad(UUID id, String accessToken, UpdatePadRequest request) {
        String tokenHash = sha256Hex(accessToken);
        Pad pad = padRepository.findByIdAndAccessTokenHash(id, tokenHash)
                .orElseThrow(() -> new PadNotFoundException("Note not found or invalid access token"));

        pad.setEncryptedTitle(request.getEncryptedTitle());
        pad.setCiphertext(request.getCiphertext());
        pad.setIv(request.getIv());
        pad.setTitleIv(request.getTitleIv());

        Pad saved = padRepository.save(pad);
        log.info("Updated pad with id={}", saved.getId());
        return toPadResponse(saved);
    }

    @Transactional
    public void deletePad(UUID id, String accessToken) {
        String tokenHash = sha256Hex(accessToken);
        Pad pad = padRepository.findByIdAndAccessTokenHash(id, tokenHash)
                .orElseThrow(() -> new PadNotFoundException("Note not found or invalid access token"));

        padRepository.delete(pad);
        log.info("Deleted pad with id={}", id);
    }

    private PadResponse toPadResponse(Pad pad) {
        return PadResponse.builder()
                .id(pad.getId())
                .encryptedTitle(pad.getEncryptedTitle())
                .ciphertext(pad.getCiphertext())
                .salt(pad.getSalt())
                .iv(pad.getIv())
                .titleIv(pad.getTitleIv())
                .kdfAlgorithm(pad.getKdfAlgorithm())
                .kdfIterations(pad.getKdfIterations())
                .createdAt(pad.getCreatedAt())
                .updatedAt(pad.getUpdatedAt())
                .build();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
