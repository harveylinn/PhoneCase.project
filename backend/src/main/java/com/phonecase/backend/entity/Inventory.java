package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// 庫存：以 品名 + 型號 + 顏色 作為一個品項
@Entity
@Table(name = "inventory")
@Getter
@Setter
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(nullable = false, length = 50)
    private String model;

    @Column(nullable = false, length = 30)
    private String color;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "updated_at",
            insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
