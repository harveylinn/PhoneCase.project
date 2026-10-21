package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiVisionResult;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;

@Service
public class AiVisionService {

    private final ChatClient chatClient;

    public AiVisionService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public AiVisionResult analyze(AiSearchRequest request) {
        var promptRequest = chatClient.prompt()
                .system("""
                        你是 PhoneCase 搜尋條件分析器。
                        只負責從使用者文字或圖片抽取搜尋條件，不負責推薦商品。
                        回傳 JSON 欄位：model、color、styleTag、reason。
                        無法確認的欄位必須是 null，不可以猜測。
                        styleTag 只能填使用者明確提到的風格，或圖片中非常明確的風格；不確定就填 null。
                        不要把商品資料、價格、庫存或其他商品的標籤加入結果。
                        """);

        try {
            if (request.hasImage()) {
                byte[] imageBytes = Base64.getDecoder().decode(request.imageBase64());
                String text = request.hasQuestion()
                        ? request.text()
                        : "請分析這張圖片中的手機型號、顏色與手機殼風格。";

                return promptRequest.user(user -> user
                                .text(text)
                                .media(
                                        MimeTypeUtils.parseMimeType(request.imageMimeType()),
                                        new ByteArrayResource(imageBytes)
                                ))
                        .call()
                        .entity(AiVisionResult.class);
            }

            return promptRequest.user(request.text())
                    .call()
                    .entity(AiVisionResult.class);
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("圖片 Base64 或 MIME type 格式錯誤", error);
        }
    }
}
