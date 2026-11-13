package com.phonecase.backend.product.dto;

import com.phonecase.backend.product.entity.ImageSample;

import java.util.List;

public record ImageSampleAnalysisResponse(
        ImageSample sample,
        AiVisionResult criteria,
        List<AiProductRecommendation> candidates
) {}
