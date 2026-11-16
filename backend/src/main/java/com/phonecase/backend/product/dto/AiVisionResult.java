package com.phonecase.backend.product.dto;

/** AI 只負責從文字或圖片抽取條件，不直接決定商品。 */
public record AiVisionResult(
        String brand,
        String model,
        String color,
        String styleTag,
        String cameraLayout,
        String reason
) {
}
