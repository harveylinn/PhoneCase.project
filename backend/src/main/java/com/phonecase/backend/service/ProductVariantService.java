package com.phonecase.backend.service;

import com.phonecase.backend.dto.ProductVariantRequest;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.phonecase.backend.entity.Product;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

// 新增、修改、刪除規格與同步後台庫存在同一個交易：同步失敗時規格一起回滾，API 回報失敗時資料也沒有寫入
// 同步以 JdbcTemplate 讀取資料表，呼叫前先 flush，讓同步讀到這次修改後的規格
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

    @Transactional
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
        productVariantRepository.flush();
        // 同步到後台庫存（品號 = SKU）；庫存以 inventory 為準，只有明確填寫時才覆蓋
        applySyncedStock(saved, shopSyncService.syncVariant(saved.getId(), request.getStock()));
        return saved;
    }

    // 回傳給前端的規格庫存改為同步後 inventory 的數量
    private void applySyncedStock(ProductVariant variant, Optional<Integer> stock) {
        stock.ifPresent(variant::setStock);
    }

    @Transactional
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
        productVariantRepository.flush();
        // 同步到後台庫存（品號 = SKU）；庫存以 inventory 為準，只有明確填寫時才覆蓋
        applySyncedStock(saved, shopSyncService.syncVariant(saved.getId(), request.getStock()));
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

    @Transactional
    public ProductVariant updateStatus(Long productId, Long id, String status) {
        ProductVariant existingVariant = productVariantRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到商品規格，id" + id));
        if (!existingVariant.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "此商品規格不屬於指定商品");
        }
        validateStatus(status);
        existingVariant.setStatus(status);
        ProductVariant saved = productVariantRepository.save(existingVariant);
        productVariantRepository.flush();
        // 上架 / 下架同步到後台庫存狀態
        shopSyncService.syncVariant(saved.getId());
        return saved;
    }

    @Transactional
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
        productVariantRepository.flush();
        // 後台庫存保留紀錄，只清空上架狀態
        shopSyncService.unlinkSkus(List.of(existingVariant.getSku()));

    }

}
