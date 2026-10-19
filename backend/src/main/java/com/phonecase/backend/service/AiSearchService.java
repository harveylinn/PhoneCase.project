package com.phonecase.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.phonecase.backend.entity.Product;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;

import java.util.List;

@Service
public class AiSearchService {

    private final ChatClient chatClient;
    private final ProductService productService;
    private final ObjectMapper objectMapper =
            new ObjectMapper().registerModule(new JavaTimeModule());

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

        List<Product> products = productService.getAvailableProducts();

        try {
            String productJson = objectMapper.writeValueAsString(products);

            String prompt = """
                    使用者問題：
                    %s

                    商品資料：
                    %s

                    請根據商品資料回答使用者問題。
                    請使用繁體中文。
                    只能推薦商品資料中實際存在的商品。
                    不要自行捏造商品名稱、型號、價格或庫存。
                    如果找不到符合的商品，請明確告知使用者。
                    最多推薦 3 個商品，並說明推薦理由。
                    """.formatted(question, productJson);

            var promptRequest = chatClient.prompt()
                    .system("""
                你是 PhoneCase 的商品智慧搜尋助手。
                你只能根據輸入的商品資料回答問題。
                請使用繁體中文，回答簡潔、清楚、親切。
                如果商品資料中沒有答案，請直接說找不到，不要自行猜測。
                """);

            if (imageBase64 != null
                    && !imageBase64.isBlank()
                    && imageMimeType != null
                    && !imageMimeType.isBlank()) {

                byte[] imageBytes = Base64.getDecoder().decode(imageBase64);

                return promptRequest
                        .user(user -> user
                                .text(prompt)
                                .media(
                                        MimeTypeUtils.parseMimeType(imageMimeType),
                                        new ByteArrayResource(imageBytes)
                                )
                        )
                        .call()
                        .content();
            }

            return promptRequest
                    .user(prompt)
                    .call()
                    .content();

        } catch (JsonProcessingException error) {
            throw new IllegalStateException("商品資料轉換失敗", error);
        }
    }
}
