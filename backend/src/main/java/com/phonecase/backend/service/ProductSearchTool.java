package com.phonecase.backend.service;

import com.phonecase.backend.entity.Product;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * 提供給 Spring AI 呼叫的手機殼商品查詢工具。
 * 工具只讀取現有商品資料，不直接修改資料庫。
 */
public class ProductSearchTool {

    private final ProductService productService;

    public ProductSearchTool(ProductService productService) {
        this.productService = productService;
    }

    @Tool(description = """
            查詢目前上架的手機殼商品。
            可依手機型號與顏色篩選；沒有條件時傳 null。
            必須只回傳資料庫實際存在的商品，不可自行建立商品。
            """)
    public List<Product> searchProducts(
            @ToolParam(description = "手機型號，例如 iPhone 16 Pro；沒有則傳 null", required = false)
            String model,
            @ToolParam(description = "顏色，例如 黑色、透明、粉色；沒有則傳 null", required = false)
            String color) {

        String normalizedModel = normalize(model);
        String normalizedColor = normalize(color);

        return productService.getAvailableProducts().stream()
                .filter(product -> product.getVariants() != null)
                .filter(product -> product.getVariants().stream().anyMatch(variant -> {
                    boolean modelMatches = normalizedModel == null
                            || containsIgnoreCase(variant.getModel(), normalizedModel);
                    boolean colorMatches = normalizedColor == null
                            || containsIgnoreCase(variant.getColor(), normalizedColor);
                    return modelMatches && colorMatches;
                }))
                .limit(10)
                .toList();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        return source != null
                && keyword != null
                && source.toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT));
    }
}
