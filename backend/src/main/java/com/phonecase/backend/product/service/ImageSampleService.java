package com.phonecase.backend.product.service;

import com.phonecase.backend.product.entity.ImageSample;
import com.phonecase.backend.product.entity.Product;
import com.phonecase.backend.product.entity.ProductImage;
import com.phonecase.backend.product.entity.ProductVariant;
import com.phonecase.backend.product.dto.AiProductRecommendation;
import com.phonecase.backend.product.dto.AiImageValidationResult;
import com.phonecase.backend.product.dto.AiSearchRequest;
import com.phonecase.backend.product.dto.AiVisionResult;
import com.phonecase.backend.product.dto.ImageSampleAnalysisResponse;
import com.phonecase.backend.product.repository.ImageSampleRepository;
import com.phonecase.backend.product.repository.ProductVariantRepository;
import com.phonecase.backend.product.repository.ProductImageRepository;
import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.List;

@Service
public class ImageSampleService {

    private final ImageSampleRepository repository;
    private final AiVisionService aiVisionService;
    private final ProductService productService;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductRecommendationService productRecommendationService;
    private final SampleImageReader imageReader;

    public ImageSampleService(
            ImageSampleRepository repository,
            AiVisionService aiVisionService,
            ProductService productService,
            ProductVariantRepository productVariantRepository,
            ProductImageRepository productImageRepository,
            ProductRecommendationService productRecommendationService,
            SampleImageReader imageReader) {
        this.repository = repository;
        this.aiVisionService = aiVisionService;
        this.productService = productService;
        this.productVariantRepository = productVariantRepository;
        this.productImageRepository = productImageRepository;
        this.productRecommendationService = productRecommendationService;
        this.imageReader = imageReader;
    }

    public List<ImageSample> findAll(String reviewStatus) {
        if (reviewStatus == null || reviewStatus.isBlank()) {
            return repository.findAll();
        }
        return repository.findByReviewStatusOrderByCreatedAtDesc(reviewStatus);
    }

    public ImageSample findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "找不到圖片樣本，id: " + id));
    }

    public ImageSample create(ImageSample sample) {
        sample.setImageUrl(SampleImageReader.cloudinaryUri(sample.getImageUrl()).toString());
        sample.setId(null);
        if (sample.getReviewStatus() == null || sample.getReviewStatus().isBlank()) {
            sample.setReviewStatus("待審核");
        }
        return repository.save(sample);
    }

    @Transactional
    public ImageSample updateReview(Long id, String reviewStatus, String reviewerNote) {
        ImageSample sample = findById(id);
        if (!List.of("待審核", "通過", "退回").contains(reviewStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "審核狀態只能是待審核、通過或退回");
        }
        if ("通過".equals(reviewStatus) && sample.getVariantId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "請先確認並關聯正確的手機品項，再通過樣本審核");
        }
        if ("通過".equals(reviewStatus)) {
            addSampleImageToVariant(sample);
        } else if ("通過".equals(sample.getReviewStatus())) {
            detachSampleImageFromVariant(sample);
        }
        sample.setReviewStatus(reviewStatus);
        sample.setReviewerNote(reviewerNote);
        return repository.save(sample);
    }

    /** 通過審核時將樣本圖加入已確認品項；既有主圖不會被取代。 */
    private void addSampleImageToVariant(ImageSample sample) {
        Long variantId = sample.getVariantId();
        List<ProductImage> existingImages = productImageRepository.findByVariantId(variantId);
        boolean alreadyAttached = existingImages.stream()
                .anyMatch(image -> sample.getImageUrl().equals(image.getImageUrl()));
        if (alreadyAttached) {
            // 只有本系統先前由樣本建立的圖片連結才會被追蹤。
            if (sample.getProductImageId() == null) {
                repository.findByVariantIdAndImageUrlAndProductImageIdIsNotNull(
                                variantId, sample.getImageUrl())
                        .stream()
                        .findFirst()
                        .ifPresent(existingSample -> sample.setProductImageId(
                                existingSample.getProductImageId()));
            }
            return;
        }

        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "找不到商品品項，id: " + variantId));
        ProductImage image = new ProductImage();
        image.setVariant(variant);
        image.setImageUrl(sample.getImageUrl());
        image.setSortOrder(existingImages.size());
        image.setIsPrimary(existingImages.stream().noneMatch(
                existing -> Boolean.TRUE.equals(existing.getIsPrimary())));
        ProductImage savedImage = productImageRepository.save(image);
        sample.setProductImageId(savedImage.getId());
    }

    /** 退回已通過樣本時，若無其他通過樣本共用此連結才移除。 */
    private void detachSampleImageFromVariant(ImageSample sample) {
        Long productImageId = sample.getProductImageId();
        if (productImageId == null) {
            return;
        }
        long otherApprovedSamples = repository.countByReviewStatusAndProductImageIdAndIdNot(
                "通過", productImageId, sample.getId());
        if (otherApprovedSamples == 0) {
            productImageRepository.deleteById(productImageId);
        }
        sample.setProductImageId(null);
    }

    public ImageSample updateDescription(Long id, String aiDescription) {
        ImageSample sample = findById(id);
        sample.setAiDescription(aiDescription);
        return repository.save(sample);
    }

    public ImageSampleAnalysisResponse analyzeImage(Long id) {
        ImageSample sample = findById(id);
        var image = imageReader.read(sample.getImageUrl());
        try {
            String mimeType = image.mimeType();
            byte[] imageBytes = image.bytes();
            List<AiProductRecommendation> candidates = List.of();
            AiVisionResult criteria = null;
            if (sample.getProductId() == null) {
                String imageBase64 = Base64.getEncoder().encodeToString(imageBytes);
                criteria = aiVisionService.analyze(
                        new AiSearchRequest(null, imageBase64, mimeType));
                candidates = productRecommendationService.findSimilar(criteria, null);
                sample.setAiDescription(buildCriteriaDescription(criteria));
                sample.setAiMatchStatus(candidates.isEmpty() ? "找不到候選" : "待確認");
                sample.setAiMatchConfidence(null);
                sample.setAiMatchReason(buildCandidateReason(criteria, candidates));
            } else {
                Product product = productService.getProductById(sample.getProductId());
                var result = aiVisionService.validateImage(
                        imageBytes, mimeType, buildProductContext(product));
                sample.setAiDescription(buildValidationDescription(result));
                sample.setAiMatchStatus(result.matchesProduct() == null
                        ? "待確認"
                        : result.matchesProduct() ? "符合" : "不符合");
                sample.setAiMatchConfidence(result.confidence());
                sample.setAiMatchReason(result.reason());
            }
            return new ImageSampleAnalysisResponse(
                    repository.save(sample), criteria, candidates);
        } catch (Exception error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "AI 圖片分析失敗", error);
        }
    }

    /** 依管理員修正後的條件重新產生同品牌／型號候選。 */
    public List<AiProductRecommendation> findCandidatesByCorrection(
            Long id, String brand, String model, String color, String styleTag) {
        ImageSample sample = findById(id);
        AiVisionResult corrected = new AiVisionResult(
                cleanCorrection(brand), cleanCorrection(model), cleanCorrection(color),
                cleanCorrection(styleTag), null, "管理員人工修正");
        List<AiProductRecommendation> candidates =
                productRecommendationService.findSimilar(corrected, null);
        sample.setAiDescription("人工確認條件：品牌=" + valueOrUnknown(brand)
                + "、型號=" + valueOrUnknown(model)
                + "、顏色=" + valueOrUnknown(color)
                + "、風格=" + valueOrUnknown(styleTag));
        sample.setAiMatchStatus(candidates.isEmpty() ? "找不到候選" : "人工條件待確認");
        sample.setAiMatchReason(candidates.isEmpty()
                ? "依人工修正條件找不到候選，請搜尋其他商品規格或調整條件。"
                : "候選已依人工修正條件重新產生，請確認正確品項。");
        repository.save(sample);
        return candidates;
    }

    private String cleanCorrection(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public ImageSample confirmProduct(Long id, Long productId, Long variantId) {
        if (productId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "商品 ID 不可為空");
        }
        productService.getProductById(productId);
        ImageSample sample = findById(id);
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "找不到商品品項，id: " + variantId));
            if (variant.getProduct() == null
                    || !productId.equals(variant.getProduct().getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "商品品項與商品系列不一致");
            }
        }
        sample.setProductId(productId);
        sample.setVariantId(variantId);
        sample.setAiMatchStatus("已確認");
        return repository.save(sample);
    }

    private String buildCriteriaDescription(AiVisionResult criteria) {
        return "AI 分析：品牌=" + valueOrUnknown(
                criteria.brand() != null ? criteria.brand() : inferBrandFromModel(criteria.model()))
                + "、型號=" + valueOrUnknown(criteria.model())
                + "、顏色=" + valueOrUnknown(criteria.color())
                + "、風格=" + valueOrUnknown(criteria.styleTag())
                + "、鏡頭特徵=" + valueOrUnknown(criteria.cameraLayout());
    }

    private String buildValidationDescription(
            AiImageValidationResult result) {
        return "AI 辨識：品牌=" + valueOrUnknown(
                result.brand() != null ? result.brand() : inferBrandFromModel(result.model()))
                + "、型號=" + valueOrUnknown(result.model())
                + "、顏色=" + valueOrUnknown(result.color())
                + "、風格=" + valueOrUnknown(result.styleTag())
                + "、鏡頭特徵=" + valueOrUnknown(result.cameraLayout())
                + "。圖片描述：" + valueOrUnknown(result.description());
    }

    private String buildCandidateReason(
            AiVisionResult criteria,
            List<AiProductRecommendation> candidates) {
        if (candidates.isEmpty()) {
            return "AI 分析後找不到可比對的商品，請補充商品資料或 tags。";
        }
        String names = candidates.stream()
                .map(candidate -> candidate.productId() + ": " + candidate.productName())
                .distinct()
                .reduce((left, right) -> left + "；" + right)
                .orElse("無");
        return "候選商品：" + names + "。請由管理員確認後建立關聯。";
    }

    private String valueOrUnknown(String value) {
        return value == null || value.isBlank() ? "未確認" : value;
    }

    private String inferBrandFromModel(String model) {
        if (model == null || model.isBlank()) {
            return null;
        }
        String normalized = model.toLowerCase(java.util.Locale.ROOT);
        if (normalized.contains("iphone")) return "Apple";
        if (normalized.contains("galaxy")) return "Samsung";
        if (normalized.contains("pixel")) return "Google";
        if (normalized.contains("xiaomi") || normalized.contains("redmi")) {
            return "Xiaomi";
        }
        return null;
    }

    private String buildProductContext(Product product) {
        StringBuilder context = new StringBuilder();
        context.append("商品 ID：").append(product.getId()).append('\n')
                .append("商品名稱：").append(product.getName()).append('\n')
                .append("商品分類：").append(product.getCategory()).append('\n')
                .append("商品描述：").append(product.getDescription()).append('\n')
                .append("商品款式：\n");

        if (product.getVariants() != null) {
            for (ProductVariant variant : product.getVariants()) {
                context.append("- 品牌：").append(variant.getBrand())
                        .append("，型號：").append(variant.getModel())
                        .append("，顏色：").append(variant.getColor())
                        .append("，標籤：").append(variant.getTags())
                        .append('\n');
            }
        }
        return context.toString();
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }
}
