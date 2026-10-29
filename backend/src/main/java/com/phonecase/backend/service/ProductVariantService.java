package com.phonecase.backend.service;

import com.phonecase.backend.dto.ProductVariantRequest;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.phonecase.backend.entity.Product;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductVariantService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    public ProductVariantService(ProductVariantRepository productVariantRepository,
                                 ProductRepository productRepository) {
        this.productVariantRepository = productVariantRepository;
        this.productRepository = productRepository;
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
        return productVariantRepository.save(variant);
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
        return productVariantRepository.save(existingVariant);
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

    }

}
