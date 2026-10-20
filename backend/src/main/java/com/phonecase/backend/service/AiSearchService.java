package com.phonecase.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.phonecase.backend.entity.Product;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
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

        // qwen2.5vl:3b 可分析圖片，但不支援 Spring AI Tool Calling。
        // 因此先使用商品資料與嚴格提示詞，避免送出 tools 造成 HTTP 400。
        List<Product> products = productService.getAvailableProducts();

        try {
            String productJson = objectMapper.writeValueAsString(products);
            String prompt = """
                    使用者需求：
                    %s

                    目前上架商品資料：
                    %s

                    請使用繁體中文。
                    有圖片時，必須先獨立觀察圖片，再查詢商品資料：
                    1. 先只根據圖片回報「圖片觀察到的顏色」與「手機型號」。
                    2. 藍色、深藍、淺藍、寶藍都要視為藍色，不要寫成灰色或粉色。
                    3. 不可以用商品資料中的顏色反推圖片顏色。
                    4. 如果圖片顏色不確定，請明確說「圖片顏色不確定」，不要猜測。
                    5. 再從上架商品資料中找最相似的商品，並另外標示「商品資料中的顏色」。
                    只能推薦資料中實際存在的商品，不可捏造名稱、型號、價格或庫存。
                    若沒有完全符合，請改推薦最相似的商品，並明確說明是相似推薦。
                    最多推薦 3 個商品，回答要簡潔。
                    """.formatted(question, productJson);

            var promptRequest = chatClient.prompt()
                    .system("""
                            你是 PhoneCase 商品智慧搜尋助手。
                            你必須區分「圖片觀察結果」與「商品資料結果」。
                            商品資料只能用來確認商品是否存在，不能用來改寫圖片的顏色。
                            不要使用記憶補充商品資料。
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

            return promptRequest.user(prompt).call().content();
        } catch (JsonProcessingException error) {
            throw new IllegalStateException("商品資料轉換失敗", error);
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("圖片 Base64 或 MIME type 格式錯誤", error);
        }
    }
}
