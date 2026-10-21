package com.phonecase.backend.dto;

import java.math.BigDecimal;

public record AiProductRecommendation(
        Long variantId,
        String sku,
        String productName,
        String brand,
        String model,
        String color,
        String tags,
        BigDecimal price,
        Integer stock
) {
}
