package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiVisionResult;
import com.phonecase.backend.dto.AiImageValidationResult;
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

    public String describeImage(byte[] imageBytes, String imageMimeType) {
        return chatClient.prompt()
                .system("""
                        你是商品圖片標註助手。
                        請用繁體中文描述圖片中看得到的手機殼特徵，包含外觀風格、顏色、材質、透明度、磁吸環或邊框等資訊。
                        只能描述圖片中明確看得到的內容，不要猜測手機型號、品牌、價格或庫存。
                        回覆 1 到 3 句簡潔文字，不要使用 Markdown 或 JSON。
                        """)
                .user(user -> user
                        .text("請建立這張商品圖片的 AI 描述。")
                        .media(
                                MimeTypeUtils.parseMimeType(imageMimeType),
                                new ByteArrayResource(imageBytes)
                        ))
                .call()
                .content();
    }

    public AiImageValidationResult validateImage(
            byte[] imageBytes,
            String imageMimeType,
            String productContext) {
        return chatClient.prompt()
                .system("""
                        你是商品圖片審核助手。
                        請根據圖片與提供的商品資料，判斷圖片是否可能屬於這個商品。
                        只能根據圖片中明確看得到的特徵判斷，不要因為商品資料存在就直接判定符合。
                        回傳 JSON 欄位：matchesProduct、confidence、description、reason。
                        matchesProduct 只能是 true、false 或 null；不確定時填 null。
                        confidence 是 0 到 100 的整數；不確定時填 0。
                        description 用繁體中文描述圖片中看得到的手機殼特徵。
                        reason 用繁體中文說明判斷依據。
                        """)
                .user(user -> user
                        .text("""
                                請審核這張圖片是否符合以下商品資料：
                                %s
                                """.formatted(productContext))
                        .media(
                                MimeTypeUtils.parseMimeType(imageMimeType),
                                new ByteArrayResource(imageBytes)
                        ))
                .call()
                .entity(AiImageValidationResult.class);
    }
}
