package com.phonecase.backend.product.controller;

import com.phonecase.backend.product.dto.AiSearchRequest;
import com.phonecase.backend.product.dto.AiSearchResponse;
import com.phonecase.backend.product.service.AiSearchService;
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
        return aiSearchService.search(request);
    }
}
