package com.phonecase.backend.dto;

public record AiSearchRequest(
        String text,
        String imageBase64,
        String imageMimeType
) {
    public boolean hasImage() {
        return imageBase64 != null && !imageBase64.isBlank()
                && imageMimeType != null && !imageMimeType.isBlank();
    }

    public boolean hasQuestion() {
        return text != null && !text.isBlank();
    }
}
