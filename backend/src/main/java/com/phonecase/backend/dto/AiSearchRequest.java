package com.phonecase.backend.dto;

public record AiSearchRequest(
        String text,
        String imageBase64,
        String imageMimeType,
        String imageFileName
) {
    /** 相容舊有樣本分析流程：沒有檔名時使用 null。 */
    public AiSearchRequest(String text, String imageBase64, String imageMimeType) {
        this(text, imageBase64, imageMimeType, null);
    }
    public boolean hasImage() {
        return imageBase64 != null && !imageBase64.isBlank()
                && imageMimeType != null && !imageMimeType.isBlank();
    }

    public boolean hasQuestion() {
        return text != null && !text.isBlank();
    }
}
