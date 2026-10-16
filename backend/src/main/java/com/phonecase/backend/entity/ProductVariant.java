package com.phonecase.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonBackReference("product-variants")
    private Product product;

    private String brand;

    private String model;

    private String color;

    private BigDecimal price;

    private Integer stock;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    private String status = "上架";

    @Column(
            name = "created_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    @Column(
            name = "updated_at",
            insertable = false,
            updatable = false
    )
    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "variant",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonManagedReference("variant-images")
    private List<ProductImage> images = new ArrayList<>();
}