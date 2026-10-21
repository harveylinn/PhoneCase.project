package com.phonecase.backend.service;

import com.phonecase.backend.entity.ImageSample;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ImageSampleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class ImageSampleService {

    private final ImageSampleRepository repository;
    private final AiVisionService aiVisionService;
    private final ProductService productService;
    private final Path uploadRoot;

    public ImageSampleService(
            ImageSampleRepository repository,
            AiVisionService aiVisionService,
            ProductService productService,
            @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.repository = repository;
        this.aiVisionService = aiVisionService;
        this.productService = productService;
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

    public ImageSample analyzeImage(Long id) {
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
            if (sample.getProductId() == null) {
                sample.setAiDescription(aiVisionService.describeImage(imageBytes, mimeType));
                sample.setAiMatchStatus("未比對");
                sample.setAiMatchConfidence(null);
                sample.setAiMatchReason("未設定關聯商品 ID");
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
            return repository.save(sample);
        } catch (Exception error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "AI 圖片分析失敗", error);
        }
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
