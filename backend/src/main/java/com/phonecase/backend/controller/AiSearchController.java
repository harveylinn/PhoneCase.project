package com.phonecase.backend.controller;

import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiSearchResponse;
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
        return new AiSearchResponse(aiSearchService.search(request));
    }
}
