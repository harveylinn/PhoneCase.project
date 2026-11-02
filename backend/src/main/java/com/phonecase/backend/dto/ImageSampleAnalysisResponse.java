package com.phonecase.backend.dto;

import com.phonecase.backend.entity.ImageSample;

import java.util.List;

public record ImageSampleAnalysisResponse(
        ImageSample sample,
        AiVisionResult criteria,
        List<AiProductRecommendation> candidates
) {}
