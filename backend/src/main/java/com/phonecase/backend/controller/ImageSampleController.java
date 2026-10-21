package com.phonecase.backend.controller;

import com.phonecase.backend.entity.ImageSample;
import com.phonecase.backend.service.ImageSampleService;
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

    @GetMapping
    public List<ImageSample> findAll(
            @RequestParam(required = false) String reviewStatus) {
        return service.findAll(reviewStatus);
    }

    @GetMapping("/{id}")
    public ImageSample findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ImageSample create(@Valid @RequestBody ImageSample sample) {
        return service.create(sample);
    }

    /**
     * 後台人工審核圖片樣本。
     */
    @PatchMapping("/{id}/review")
    public ImageSample updateReview(
            @PathVariable Long id,
            @RequestBody ReviewRequest request) {
        return service.updateReview(
                id, request.reviewStatus(), request.reviewerNote());
    }

    @PatchMapping("/{id}/description")
    public ImageSample updateDescription(
            @PathVariable Long id,
            @RequestBody DescriptionRequest request) {
        return service.updateDescription(id, request.aiDescription());
    }

    @PostMapping("/{id}/analyze")
    public ImageSample analyzeImage(@PathVariable Long id) {
        return service.analyzeImage(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    public record ReviewRequest(
            @NotBlank String reviewStatus,
            String reviewerNote
    ) {}

    public record DescriptionRequest(String aiDescription) {}
}
