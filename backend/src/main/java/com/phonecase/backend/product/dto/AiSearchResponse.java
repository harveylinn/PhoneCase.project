package com.phonecase.backend.product.dto;

import java.util.List;

public record AiSearchResponse(
        String answer,
        List<AiProductRecommendation> products
) {
}
