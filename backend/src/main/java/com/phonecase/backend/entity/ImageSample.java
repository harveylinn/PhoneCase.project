package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 圖片樣本庫資料。
 * 儲存圖片來源、授權、AI 描述與人工審核結果。
 */
@Entity
@Table(name = "image_samples")
@Getter
@Setter
public class ImageSample {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(length = 255)
    private String source;

    @Column(name = "license_type", length = 100)
    private String licenseType;

    @Column(name = "license_note", columnDefinition = "TEXT")
    private String licenseNote;

    @Column(name = "ai_description", columnDefinition = "TEXT")
    private String aiDescription;

    @Column(name = "review_status", nullable = false, length = 30)
    private String reviewStatus = "待審核";

    @Column(name = "reviewer_note", columnDefinition = "TEXT")
    private String reviewerNote;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
