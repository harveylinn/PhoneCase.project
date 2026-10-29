package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.dto.AiVisionResult;
import org.springframework.stereotype.Service;

import java.util.List;

/** 將結構化分析結果與資料庫商品組合成前端顯示文字。 */
@Service
public class AiAnswerService {

    public String format(AiVisionResult criteria,
                         List<AiProductRecommendation> products,
                         boolean exact) {
        StringBuilder answer = new StringBuilder();

        answer.append("圖片分析結果：")
                .append("品牌 ").append(valueOrUnknown(criteria.brand()))
                .append("、型號 ").append(valueOrUnknown(criteria.model()))
                .append("、顏色／透明度 ").append(valueOrUnknown(criteria.color()))
                .append("\n\n");

        if (products.isEmpty()) {
            answer.append("目前還無法找到符合的商品。\n");

            if (isBlank(criteria.brand()) && isBlank(criteria.model())) {
                answer.append("請先告訴我手機品牌與型號，例如：iPhone 17 Pro 或 Samsung Galaxy S25；確認後我再詢問顏色或風格。\n");
            } else if (isBlank(criteria.model())) {
                answer.append("請再提供完整的手機型號，我才能精準推薦。\n");
            } else {
                answer.append("目前分析條件：")
                        .append(valueOrUnknown(criteria.brand()))
                        .append("、")
                        .append(valueOrUnknown(criteria.model()))
                        .append("、")
                        .append(valueOrUnknown(criteria.color()))
                        .append("。\n");
            }

            if (criteria.styleTag() != null && !criteria.styleTag().isBlank()) {
                answer.append("、").append(criteria.styleTag());
            }
            return answer.toString();
        }

        if (exact) {
            answer.append("找到符合的商品：\n");
        } else {
            answer.append("找不到完全符合的商品，以下是相似推薦：\n");
        }
        for (int index = 0; index < products.size(); index++) {
            AiProductRecommendation product = products.get(index);
            answer.append(index + 1)
                    .append(". ")
                    .append(product.productName())
                    .append(" - ")
                    .append(product.model())
                    .append("\n   顏色：")
                    .append(product.color())
                    .append("\n   標籤：")
                    .append(product.tags() == null || product.tags().isBlank()
                            ? "無標籤" : product.tags())
                    .append("\n   價格：NT$ ")
                    .append(product.price())
                    .append("\n   庫存：")
                    .append(product.stock())
                    .append("\n");
        }
        return answer.toString();
    }

    private String valueOrUnknown(String value) {
        return value == null || value.isBlank() ? "未確認" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
