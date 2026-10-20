package com.phonecase.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;

@Service
public class AiSearchService {

    private final ChatClient chatClient;
    private final ProductService productService;

    public AiSearchService(
            ChatClient.Builder chatClientBuilder,
            ProductService productService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.productService = productService;
    }

    public String search(
            String question,
            String imageBase64,
            String imageMimeType
    ) {
        if (question == null || question.isBlank()) {
            throw new IllegalArgumentException("問題不能是空白");
        }

        // 參考老師範本：讓 AI 透過工具查詢真實商品，不再把整份商品 JSON
        // 塞進提示詞後讓模型自行猜測。
        ProductSearchTool productSearchTool = new ProductSearchTool(productService);

        var promptRequest = chatClient.prompt()
                .system("""
                        你是 PhoneCase 商品智慧搜尋助手，請使用繁體中文。
                        你必須先根據使用者文字或圖片辨識出手機型號與顏色，
                        再呼叫 searchProducts 工具查詢商品。
                        商品名稱、型號、顏色、價格與庫存只能使用工具回傳的資料，
                        不可以自行捏造。
                        如果精準條件查不到，請放寬顏色條件再查一次；
                        仍查不到時，明確說明目前沒有符合商品。
                        最多推薦 3 個實際存在的商品，並說明推薦理由。
                        """)
                .tools(productSearchTool);

        String userText = """
                使用者需求：
                %s

                若有圖片，請先分析圖片中的手機型號、顏色與手機殼外觀，
                再使用商品查詢工具找出真正存在的相似商品。
                """.formatted(question);

        try {
            if (imageBase64 != null
                    && !imageBase64.isBlank()
                    && imageMimeType != null
                    && !imageMimeType.isBlank()) {

                byte[] imageBytes = Base64.getDecoder().decode(imageBase64);

                return promptRequest
                        .user(user -> user
                                .text(userText)
                                .media(
                                        MimeTypeUtils.parseMimeType(imageMimeType),
                                        new ByteArrayResource(imageBytes)
                                )
                        )
                        .call()
                        .content();
            }

            return promptRequest
                    .user(userText)
                    .call()
                    .content();

        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("圖片 Base64 或 MIME type 格式錯誤", error);
        }
    }
}
