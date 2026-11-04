package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiVisionResult;
import com.phonecase.backend.dto.AiSearchResponse;
import com.phonecase.backend.exception.AiSearchException;
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

    public AiSearchResponse search(AiSearchRequest request) {
        if (request == null || (!request.hasQuestion() && !request.hasImage())) {
            throw new IllegalArgumentException("請輸入問題或上傳圖片");
        }

        try {
            AiVisionResult criteria = aiVisionService.analyze(request);
            // 智慧搜尋採嚴格條件比對：有輸入的條件必須全部符合。
            // 相似商品推薦保留給圖片樣本審核流程，不在一般商品搜尋中混用，
            // 避免使用者輸入型號與風格後，仍收到只有部分符合的商品。
            List<AiProductRecommendation> products =
                    recommendationService.findMatches(criteria, request.text());
            boolean exact = !products.isEmpty();

            return new AiSearchResponse(
                    aiAnswerService.format(criteria, products, exact),
                    products
            );
        } catch (IllegalArgumentException exception) {
            // 輸入格式錯誤要保留 400，讓前端能提示使用者修正資料。
            throw exception;
        } catch (Exception exception) {
            // 不把 Ollama 的原始堆疊或英文錯誤直接暴露給前端。
            throw new AiSearchException(
                    "AI_SERVICE_UNAVAILABLE",
                    "AI 服務目前無法回應，請確認 Ollama 是否啟動，稍後再試。",
                    exception
            );
        }
    }
}
