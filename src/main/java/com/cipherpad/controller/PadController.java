package com.cipherpad.controller;

import com.cipherpad.dto.*;
import com.cipherpad.service.PadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PadController {

    private static final String TOKEN_HEADER = "X-Access-Token";
    private final PadService padService;

    public PadController(PadService padService) {
        this.padService = padService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "CipherPad"));
    }

    @PostMapping("/pads")
    public ResponseEntity<CreatePadResponse> createPad(@Valid @RequestBody CreatePadRequest request) {
        CreatePadResponse response = padService.createPad(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pads/{id}")
    public ResponseEntity<PadResponse> getPad(
            @PathVariable UUID id,
            @RequestHeader(TOKEN_HEADER) String accessToken) {
        PadResponse response = padService.getPad(id, accessToken);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/pads/{id}")
    public ResponseEntity<PadResponse> updatePad(
            @PathVariable UUID id,
            @RequestHeader(TOKEN_HEADER) String accessToken,
            @Valid @RequestBody UpdatePadRequest request) {
        PadResponse response = padService.updatePad(id, accessToken, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/pads/{id}")
    public ResponseEntity<Void> deletePad(
            @PathVariable UUID id,
            @RequestHeader(TOKEN_HEADER) String accessToken) {
        padService.deletePad(id, accessToken);
        return ResponseEntity.noContent().build();
    }
}
