package com.phonecase.backend.member.exception;

import jakarta.servlet.Registration;

public class RegistrationException extends RuntimeException{

    public RegistrationException(String message) {
        super(message);
    }
}
