package com.phonecase.backend.member.dto;

public record RegisterRequest(
    String account,
    String password,
    String name,
    String phone,
    String email
    ) {
    }
