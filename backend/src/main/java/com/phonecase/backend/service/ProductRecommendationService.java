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

        // 沒有任何可搜尋條件時，不應把所有上架商品都當成符合結果。
        if (!hasSearchCriteria(correctedCriteria)) {
            return List.of();
        }

        return products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream()
                        .filter(variant -> "上架".equals(variant.getStatus()))
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

    private boolean hasSearchCriteria(AiVisionResult criteria) {
        return hasValue(criteria.brand())
                || hasValue(criteria.model())
                || hasValue(criteria.color())
                || hasValue(criteria.styleTag());
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank() && !value.startsWith("__");
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
                        .filter(variant -> "上架".equals(variant.getStatus()))
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
        String normalizedQuestion = normalizeText(question);
        String normalizedBrand = normalizeValue(criteria.brand());
        String normalizedModel = normalizeValue(criteria.model());
        String normalizedColor = normalizeValue(criteria.color());
        String normalizedStyleTag = normalizeValue(criteria.styleTag());

        String brand = findQuestionValue(normalizedQuestion, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getBrand())
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        String model = findQuestionValue(normalizedQuestion, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getModel())
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        List<String> availableColors = products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getColor())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        String color = findQuestionColor(normalizedQuestion, availableColors);

        String tag = findQuestionValue(normalizedQuestion, products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> variant.getTags())
                .filter(Objects::nonNull)
                .flatMap(tags -> java.util.Arrays.stream(tags.split("[,，、]")))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList());

        String correctedColor = color != null
                ? color
                : hasColorRequest(normalizedQuestion)
                ? "__NO_MATCHING_COLOR__"
                : validValue(normalizedColor, products, ValueType.COLOR);

        String correctedTag = tag != null
                ? tag
                : hasStyleRequest(normalizedQuestion)
                ? "__NO_MATCHING_STYLE__"
                : validValue(normalizedStyleTag, products, ValueType.TAG);

        String resolvedModel = model != null
                ? model : validValue(normalizedModel, products, ValueType.MODEL);
        String resolvedBrand = brand != null
                ? brand : validValue(normalizedBrand, products, ValueType.BRAND);
        if (resolvedBrand == null) {
            resolvedBrand = inferBrandFromModel(resolvedModel);
        }

        return new AiVisionResult(
                resolvedBrand,
                resolvedModel,
                correctedColor,
                correctedTag,
                criteria.cameraLayout(),
                criteria.reason()
        );
    }

    private boolean hasStyleRequest(String question) {
        return question != null
                && (question.contains("風") || question.contains("風格"));
    }

    /** 判斷使用者是否明確指定顏色，避免找不到顏色時退化成只比對品牌。 */
    private boolean hasColorRequest(String question) {
        return question != null && (question.contains("色")
                || question.contains("藍")
                || question.contains("紅")
                || question.contains("綠")
                || question.contains("白")
                || question.contains("黑")
                || question.contains("透明")
                || question.contains("blue")
                || question.contains("black")
                || question.contains("white"));
    }

    /** 將自然語言顏色對應到資料庫實際存在的顏色名稱。 */
    private String findQuestionColor(String question, List<String> values) {
        String direct = findQuestionValue(question, values);
        if (direct != null) return direct;

        String[][] aliases = {
                {"藍", "blue"},
                {"黑", "black"},
                {"白", "white"},
                {"紅", "red"},
                {"綠", "green"},
                {"粉", "pink"},
                {"透明", "clear", "transparent"}
        };
        for (String[] aliasGroup : aliases) {
            boolean requested = false;
            for (String alias : aliasGroup) {
                if (question != null && question.toLowerCase(Locale.ROOT).contains(alias)) {
                    requested = true;
                    break;
                }
            }
            if (requested) {
                return values.stream()
                        .filter(value -> containsAny(value, aliasGroup))
                        .max(Comparator.comparingInt(String::length))
                        .orElse(null);
            }
        }
        return null;
    }

    private boolean containsAny(String value, String[] keywords) {
        String normalized = value.toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (normalized.contains(keyword.toLowerCase(Locale.ROOT))) return true;
        }
        return false;
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

    private String normalizeText(String text) {
        if (text == null) {
            return null;
        }
        return normalizeValue(text);
    }

    private String normalizeValue(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return value
                .replace("White", "白色")
                .replace("white", "白色")
                .replace("Black", "黑色")
                .replace("black", "黑色")
                .replace("Transparent", "透明")
                .replace("transparent", "透明")
                .replace("Clear", "透明")
                .replace("clear", "透明")
                .replace("Navy", "海軍藍")
                .replace("navy", "海軍藍")
                .replace("Anime Character", "動漫風")
                .replace("anime character", "動漫風")
                .replace("Anime", "動漫風")
                .replace("anime", "動漫風")
                .replace("Pixel Art", "像素風")
                .replace("pixel art", "像素風")
                .replace("Pixel", "像素風")
                .replace("pixel", "像素風");
    }

    private String inferBrandFromModel(String model) {
        if (model == null || model.isBlank()) {
            return null;
        }
        String normalized = model.toLowerCase(Locale.ROOT);
        if (normalized.contains("iphone")) return "Apple";
        if (normalized.contains("galaxy")) return "Samsung";
        if (normalized.contains("pixel")) return "Google";
        if (normalized.contains("xiaomi") || normalized.contains("redmi")) {
            return "Xiaomi";
        }
        return null;
    }

    private String validValue(String value, List<Product> products, ValueType type) {
        if (value == null || value.isBlank()) {
            return null;
        }
        List<String> values = products.stream()
                .filter(product -> product.getVariants() != null)
                .flatMap(product -> product.getVariants().stream())
                .map(variant -> switch (type) {
                    case BRAND -> variant.getBrand();
                    case MODEL -> variant.getModel();
                    case COLOR -> variant.getColor();
                    case TAG -> variant.getTags();
                })
                .filter(Objects::nonNull)
                .toList();
        return values.stream().anyMatch(item -> contains(item, value)) ? value : null;
    }

    private enum ValueType { BRAND, MODEL, COLOR, TAG }

    private boolean matches(ProductVariant variant, AiVisionResult criteria) {
        return contains(variant.getBrand(), criteria.brand())
                && contains(variant.getModel(), criteria.model())
                && contains(variant.getColor(), criteria.color())
                && contains(variant.getTags(), criteria.styleTag());
    }

    private int score(ProductVariant variant, AiVisionResult criteria) {
        int score = 0;
        score += exactScore(variant.getBrand(), criteria.brand(), 3);
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
        String imageUrl = null;
        if (variant.getImages() != null && !variant.getImages().isEmpty()) {
            imageUrl = variant.getImages().stream()
                    .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                    .findFirst()
                    .orElse(variant.getImages().get(0))
                    .getImageUrl();
        }
        return new AiProductRecommendation(
                product.getId(), variant.getId(), variant.getSku(), product.getName(),
                variant.getBrand(), variant.getModel(), variant.getColor(),
                variant.getTags(), variant.getPrice(), variant.getStock(), imageUrl
        );
    }
}
