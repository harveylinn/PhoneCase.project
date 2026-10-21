package com.phonecase.backend.dto;

public record AiImageValidationResult(
        Boolean matchesProduct,
        Integer confidence,
        String description,
        String reason
) {}
