package com.phonecase.backend.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleLoginRequest(
    @NotBlank(message = "缺少 Google 憑證。")
    @Size(max = 10000, message = "Google 憑證過長。")
    String credential
) {}