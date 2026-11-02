package com.phonecase.backend.repository;

import com.phonecase.backend.entity.ImageSample;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImageSampleRepository extends JpaRepository<ImageSample, Long> {

    List<ImageSample> findByReviewStatusOrderByCreatedAtDesc(String reviewStatus);

    List<ImageSample> findByProductIdOrderByCreatedAtDesc(Long productId);
}
