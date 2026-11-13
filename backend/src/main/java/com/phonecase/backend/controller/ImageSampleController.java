package com.phonecase.backend.controller;

import com.phonecase.backend.entity.ImageSample;
import com.phonecase.backend.dto.ImageSampleAnalysisResponse;
import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.service.ImageSampleService;
import com.phonecase.backend.member.security.AdminOnly;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/image-samples")
public class ImageSampleController {

    private final ImageSampleService service;

    public ImageSampleController(ImageSampleService service) {
        this.service = service;
    }

    @AdminOnly
    @GetMapping
    @AdminOnly
    public List<ImageSample> findAll(
            @RequestParam(required = false) String reviewStatus) {
        return service.findAll(reviewStatus);
    }

    @AdminOnly
    @GetMapping("/{id}")
    @AdminOnly
    public ImageSample findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @AdminOnly
    @PostMapping
    @AdminOnly
    public ImageSample create(@Valid @RequestBody ImageSample sample) {
        return service.create(sample);
    }

    /**
     * 後台人工審核圖片樣本。
     */
    @AdminOnly
    @PatchMapping("/{id}/review")
    @AdminOnly
    public ImageSample updateReview(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {
        return service.updateReview(
                id, request.reviewStatus(), request.reviewerNote());
    }

    @AdminOnly
    @PatchMapping("/{id}/description")
    @AdminOnly
    public ImageSample updateDescription(
            @PathVariable Long id,
            @RequestBody DescriptionRequest request) {
        return service.updateDescription(id, request.aiDescription());
    }

    @AdminOnly
    @PostMapping("/{id}/analyze")
    @AdminOnly
    public ImageSampleAnalysisResponse analyzeImage(@PathVariable Long id) {
        return service.analyzeImage(id);
    }

    @AdminOnly
    @PostMapping("/{id}/candidates")
    public List<AiProductRecommendation> findCandidatesByCorrection(
            @PathVariable Long id, @RequestBody CandidateCorrectionRequest request) {
        return service.findCandidatesByCorrection(
                id, request.brand(), request.model(), request.color(), request.styleTag());
    }

    @AdminOnly
    @PatchMapping("/{id}/product")
    @AdminOnly
    public ImageSample confirmProduct(
            @PathVariable Long id,
            @RequestBody ProductRequest request) {
        return service.confirmProduct(id, request.productId(), request.variantId());
    }

    @AdminOnly
    @DeleteMapping("/{id}")
    @AdminOnly
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record ReviewRequest(
            @NotBlank String reviewStatus,
            String reviewerNote
    ) {}

    public record DescriptionRequest(String aiDescription) {}

    public record ProductRequest(Long productId, Long variantId) {}

    public record CandidateCorrectionRequest(
            String brand, String model, String color, String styleTag) {}
}
