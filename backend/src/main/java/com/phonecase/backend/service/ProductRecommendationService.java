package com.phonecase.backend.service;

import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.dto.AiVisionResult;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Comparator;

@Service
public class ProductRecommendationService {

    private final ProductService productService;

    public ProductRecommendationService(ProductService productService) {
        this.productService = productService;
    }

    public List<AiProductRecommendation> findMatches(
            AiVisionResult criteria,
            String question
    ) {
        List<Product> products = productService.getAvailableProducts();
        AiVisionResult correctedCriteria = correctCriteria(criteria, question, products);

        return products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream()
                        .filter(variant -> variant.getStock() != null
                                && variant.getStock() > 0)
                        .filter(variant -> matches(variant, correctedCriteria))
                        .sorted(Comparator.comparingInt(
                                (ProductVariant variant) -> score(variant, correctedCriteria)
                        ).reversed())
                        .map(variant -> toRecommendation(product, variant)))
                .limit(3)
                .toList();
    }

    public List<AiProductRecommendation> findSimilar(
            AiVisionResult criteria,
            String question
    ) {
        List<Product> products = productService.getAvailableProducts();
        AiVisionResult correctedCriteria = correctCriteria(criteria, question, products);

        return products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream()
                        .filter(variant -> variant.getStock() != null
                                && variant.getStock() > 0)
                        .filter(variant -> score(variant, correctedCriteria) > 0)
                        .sorted(Comparator.comparingInt(
                                (ProductVariant variant) -> score(variant, correctedCriteria)
                        ).reversed())
                        .map(variant -> toRecommendation(product, variant)))
                .limit(3)
                .toList();
    }

    private AiVisionResult correctCriteria(
            AiVisionResult criteria,
            String question,
            List<Product> products
    ) {
        String model = findQuestionValue(question, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getModel())
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        String color = findQuestionValue(question, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getColor())
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        String tag = findQuestionValue(question, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getTags())
                .filter(Objects::nonNull)
                .flatMap(tags -> java.util.Arrays.stream(tags.split("[,，、]")))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList());

        String correctedTag = tag != null
                ? tag
                : hasStyleRequest(question)
                ? "__NO_MATCHING_STYLE__"
                : validValue(criteria.styleTag(), products, ValueType.TAG);

        return new AiVisionResult(
                model != null ? model : validValue(criteria.model(), products, ValueType.MODEL),
                color != null ? color : validValue(criteria.color(), products, ValueType.COLOR),
                correctedTag,
                criteria.reason()
        );
    }

    private boolean hasStyleRequest(String question) {
        return question != null
                && (question.contains("風") || question.contains("風格"));
    }

    private String findQuestionValue(String question, List<String> values) {
        if (question == null || question.isBlank()) {
            return null;
        }
        return values.stream()
                .filter(value -> question.toLowerCase(Locale.ROOT)
                        .contains(value.toLowerCase(Locale.ROOT)))
                .max((left, right) -> Integer.compare(left.length(), right.length()))
                .orElse(null);
    }

    private String validValue(String value, List<Product> products, ValueType type) {
        if (value == null || value.isBlank()) {
            return null;
        }
        List<String> values = products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> switch (type) {
                    case MODEL -> variant.getModel();
                    case COLOR -> variant.getColor();
                    case TAG -> variant.getTags();
                })
                .filter(Objects::nonNull)
                .toList();
        return values.stream().anyMatch(item -> contains(item, value)) ? value : null;
    }

    private enum ValueType { MODEL, COLOR, TAG }

    private boolean matches(ProductVariant variant, AiVisionResult criteria) {
        return contains(variant.getModel(), criteria.model())
                && contains(variant.getColor(), criteria.color())
                && contains(variant.getTags(), criteria.styleTag());
    }

    private int score(ProductVariant variant, AiVisionResult criteria) {
        int score = 0;
        score += exactScore(variant.getModel(), criteria.model(), 4);
        score += exactScore(variant.getColor(), criteria.color(), 2);
        score += exactScore(variant.getTags(), criteria.styleTag(), 3);
        return score;
    }

    private int exactScore(String source, String keyword, int points) {
        if (keyword == null || keyword.isBlank()
                || keyword.startsWith("__") || source == null) {
            return 0;
        }
        return source.equalsIgnoreCase(keyword.trim()) ? points : 1;
    }

    private boolean contains(String source, String keyword) {
        return keyword == null || keyword.isBlank()
                || (source != null && source.toLowerCase(Locale.ROOT)
                .contains(keyword.trim().toLowerCase(Locale.ROOT)));
    }

    private AiProductRecommendation toRecommendation(Product product, ProductVariant variant) {
        return new AiProductRecommendation(
                product.getId(), variant.getId(), variant.getSku(), product.getName(),
                variant.getBrand(), variant.getModel(), variant.getColor(),
                variant.getTags(), variant.getPrice(), variant.getStock()
        );
    }
}
