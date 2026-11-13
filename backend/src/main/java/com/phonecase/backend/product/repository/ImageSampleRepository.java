package com.phonecase.backend.product.repository;

import com.phonecase.backend.product.entity.ImageSample;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImageSampleRepository extends JpaRepository<ImageSample, Long> {

    List<ImageSample> findByReviewStatusOrderByCreatedAtDesc(String reviewStatus);

    List<ImageSample> findByProductIdOrderByCreatedAtDesc(Long productId);

    long countByReviewStatusAndVariantId(String reviewStatus, Long variantId);

    @Query("SELECT s.variantId, COUNT(s) FROM ImageSample s "
            + "WHERE s.reviewStatus = :status AND s.variantId IN :variantIds "
            + "GROUP BY s.variantId")
    List<Object[]> countByReviewStatusAndVariantIds(
            @Param("status") String status,
            @Param("variantIds") Collection<Long> variantIds);

    List<ImageSample> findByVariantIdAndImageUrlAndProductImageIdIsNotNull(
            Long variantId, String imageUrl);

    long countByReviewStatusAndProductImageIdAndIdNot(
            String reviewStatus, Long productImageId, Long id);
}
