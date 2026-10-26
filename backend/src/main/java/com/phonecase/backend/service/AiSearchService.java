package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiVisionResult;
import org.springframework.stereotype.Service;

import java.util.List;

/** 協調老師 C 的流程：分析條件 → Java 查商品 → 組合回答。 */
@Service
public class AiSearchService {

    private final AiVisionService aiVisionService;
    private final ProductRecommendationService recommendationService;
    private final AiAnswerService aiAnswerService;

    public AiSearchService(
            AiVisionService aiVisionService,
            ProductRecommendationService recommendationService,
            AiAnswerService aiAnswerService
    ) {
        this.aiVisionService = aiVisionService;
        this.recommendationService = recommendationService;
        this.aiAnswerService = aiAnswerService;
    }

    public String search(AiSearchRequest request) {
        if (request == null || (!request.hasQuestion() && !request.hasImage())) {
            throw new IllegalArgumentException("請輸入問題或上傳圖片");
        }

        AiVisionResult criteria = aiVisionService.analyze(request);
        // 智慧搜尋採嚴格條件比對：有輸入的條件必須全部符合。
        // 相似商品推薦保留給圖片樣本審核流程，不在一般商品搜尋中混用，
        // 避免使用者輸入型號與風格後，仍收到只有部分符合的商品。
        List<AiProductRecommendation> products =
                recommendationService.findMatches(criteria, request.text());
        boolean exact = !products.isEmpty();

        return aiAnswerService.format(criteria, products, exact);
    }
}
