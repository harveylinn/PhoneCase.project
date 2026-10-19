package com.phonecase.backend.controller;

import com.phonecase.backend.service.AiSearchService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiSearchController {

    private final AiSearchService aiSearchService;

    public AiSearchController(AiSearchService aiSearchService) {
        this.aiSearchService = aiSearchService;
    }

    @PostMapping("/search")
    public AiSearchResponse search(@RequestBody AiSearchRequest request) {
        String answer = aiSearchService.search(
                request.text(),
                request.imageBase64(),
                request.imageMimeType()
        );
        return new AiSearchResponse(answer);
    }

    public record AiSearchRequest(
            String text,
            String imageBase64,
            String imageMimeType
    ) {
    }

    public record AiSearchResponse(String answer) {
    }
}