package com.phonecase.backend.service;

import com.phonecase.backend.entity.ImageSample;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.dto.AiProductRecommendation;
import com.phonecase.backend.dto.AiSearchRequest;
import com.phonecase.backend.dto.AiVisionResult;
import com.phonecase.backend.dto.ImageSampleAnalysisResponse;
import com.phonecase.backend.repository.ImageSampleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;

@Service
public class ImageSampleService {

    private final ImageSampleRepository repository;
    private final AiVisionService aiVisionService;
    private final ProductService productService;
    private final ProductRecommendationService productRecommendationService;
    private final Path uploadRoot;

    public ImageSampleService(
            ImageSampleRepository repository,
            AiVisionService aiVisionService,
            ProductService productService,
            ProductRecommendationService productRecommendationService,
            @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.repository = repository;
        this.aiVisionService = aiVisionService;
        this.productService = productService;
        this.productRecommendationService = productRecommendationService;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
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
        sample.setId(null);
        if (sample.getReviewStatus() == null || sample.getReviewStatus().isBlank()) {
            sample.setReviewStatus("待審核");
        }
        return repository.save(sample);
    }

    public ImageSample updateReview(Long id, String reviewStatus, String reviewerNote) {
        ImageSample sample = findById(id);
        if (!List.of("待審核", "通過", "退回").contains(reviewStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "審核狀態只能是待審核、通過或退回");
        }
        sample.setReviewStatus(reviewStatus);
        sample.setReviewerNote(reviewerNote);
        return repository.save(sample);
    }

    public ImageSample updateDescription(Long id, String aiDescription) {
        ImageSample sample = findById(id);
        sample.setAiDescription(aiDescription);
        return repository.save(sample);
    }

    public ImageSampleAnalysisResponse analyzeImage(Long id) {
        ImageSample sample = findById(id);
        String imageUrl = sample.getImageUrl();

        if (imageUrl == null || !imageUrl.startsWith("/images/")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "只能分析由系統上傳的圖片");
        }

        String filename = imageUrl.substring("/images/".length());
        Path imagePath = uploadRoot.resolve(filename).normalize();
        if (!imagePath.startsWith(uploadRoot) || !Files.isRegularFile(imagePath)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "找不到圖片檔案");
        }

        try {
            String mimeType = Files.probeContentType(imagePath);
            if (mimeType == null || !mimeType.startsWith("image/")) {
                mimeType = "image/jpeg";
            }
            byte[] imageBytes = Files.readAllBytes(imagePath);
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
                sample.setAiDescription(result.description());
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

    public ImageSample confirmProduct(Long id, Long productId) {
        if (productId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "商品 ID 不可為空");
        }
        productService.getProductById(productId);
        ImageSample sample = findById(id);
        sample.setProductId(productId);
        sample.setAiMatchStatus("已確認");
        return repository.save(sample);
    }

    private String buildCriteriaDescription(AiVisionResult criteria) {
        return "AI 分析：品牌=" + valueOrUnknown(criteria.brand())
                + "、型號=" + valueOrUnknown(criteria.model())
                + "、顏色=" + valueOrUnknown(criteria.color())
                + "、風格=" + valueOrUnknown(criteria.styleTag())
                + "、鏡頭特徵=" + valueOrUnknown(criteria.cameraLayout());
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
