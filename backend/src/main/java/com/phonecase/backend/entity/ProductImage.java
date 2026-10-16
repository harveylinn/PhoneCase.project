package com.example.phonecase.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Getter
@Setter
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 多張圖片屬於一個商品規格
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    @JsonBackReference("variant-images")
    private ProductVariant variant;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(
            name = "created_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;


}