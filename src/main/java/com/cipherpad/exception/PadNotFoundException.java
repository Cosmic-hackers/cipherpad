package com.cipherpad.exception;

public class PadNotFoundException extends RuntimeException {
    public PadNotFoundException(String message) {
        super(message);
    }
}
