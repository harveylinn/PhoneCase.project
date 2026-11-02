package com.phonecase.backend.dto;

import java.util.List;

public record AiSearchResponse(
        String answer,
        List<AiProductRecommendation> products
) {
}
