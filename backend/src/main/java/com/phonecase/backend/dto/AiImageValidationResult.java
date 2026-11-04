package com.phonecase.backend.dto;

public record AiImageValidationResult(
        Boolean matchesProduct,
        Integer confidence,
        String brand,
        String model,
        String color,
        String styleTag,
        String cameraLayout,
        String description,
        String reason
) {}
