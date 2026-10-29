package com.phonecase.backend.service;

import com.phonecase.backend.dto.ProductVariantRequest;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.phonecase.backend.entity.Product;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductVariantService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ShopSyncService shopSyncService;

    public ProductVariantService(ProductVariantRepository productVariantRepository,
                                 ProductRepository productRepository,
                                 ShopSyncService shopSyncService) {
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
        this.shopSyncService = shopSyncService;
    }

    public ProductVariant addVariant(
            Long productId,
            ProductVariantRequest request) {

        validateStatus(request.getStatus());
        if (productVariantRepository.existsBySkuIgnoreCase(request.getSku())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "SKU 已存在，請使用其他商品編號"
            );
        }

        ProductVariant variant = new ProductVariant();

        variant.setBrand(request.getBrand());
        variant.setModel(request.getModel());
        variant.setColor(request.getColor());
        variant.setPrice(request.getPrice());
        variant.setStock(request.getStock() == null ? 0 : request.getStock());
        variant.setSku(request.getSku());
        variant.setStatus(request.getStatus());
        variant.setTags(request.getTags());
        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + productId
                        )
                );
        variant.setProduct(product);
        ProductVariant saved = productVariantRepository.save(variant);
        // 同步到後台庫存（品號 = SKU）
        shopSyncService.syncVariant(saved.getId());
        return saved;
    }

    public ProductVariant updateVariant(
            Long productId,
            Long id,
            ProductVariantRequest request) {
        ProductVariant existingVariant = productVariantRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
        if (!existingVariant.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "此商品規格不屬於指定商品"
            );
        }
        validateStatus(request.getStatus());
        if (productVariantRepository.existsBySkuIgnoreCaseAndIdNot(
                request.getSku(), id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "SKU 已存在，請使用其他商品編號"
            );
        }
        existingVariant.setBrand(request.getBrand());
        existingVariant.setModel(request.getModel());
        existingVariant.setColor(request.getColor());
        existingVariant.setPrice(request.getPrice());
        if (request.getStock() != null) {
            existingVariant.setStock(request.getStock());
        }
        existingVariant.setSku(request.getSku());
        existingVariant.setStatus(request.getStatus());
        existingVariant.setTags(request.getTags());
        ProductVariant saved = productVariantRepository.save(existingVariant);
        // 同步到後台庫存（品號 = SKU）
        shopSyncService.syncVariant(saved.getId());
        return saved;
    }

    private void validateStatus(String status) {
        if (!"上架".equals(status) && !"下架".equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "商品狀態只能是上架或下架"
            );
        }
    }

    public ProductVariant updateStatus(Long productId, Long id, String status) {
        ProductVariant existingVariant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到商品規格，id" + id));
        if (!existingVariant.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "此商品規格不屬於指定商品");
        }
        validateStatus(status);
        existingVariant.setStatus(status);
        return productVariantRepository.save(existingVariant);
    }

    public void deleteVariant(
            Long productId,
            Long id) {
        ProductVariant existingVariant = productVariantRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
        if (!existingVariant.getProduct().getId().equals(productId)){
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "此商品規格不屬於指定商品"
            );
        }
        productVariantRepository.delete(existingVariant);
        // 後台庫存保留紀錄，只清空上架狀態
        shopSyncService.unlinkSkus(List.of(existingVariant.getSku()));

    }

}
