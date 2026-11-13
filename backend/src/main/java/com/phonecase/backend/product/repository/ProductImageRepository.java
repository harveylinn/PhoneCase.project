package com.phonecase.backend.product.repository;

import com.phonecase.backend.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByVariantIdAndIsPrimaryTrue(Long variantId);

    List<ProductImage> findByVariantId(Long variantId);
}
