package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_document")
@Getter
@Setter
public class AdminDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 單據類型：訂單、採購單、入庫單、出庫單
    @Column(name = "doc_type", nullable = false, length = 20)
    private String docType;

    // 單號（前端欄位名稱為 orderNo）
    @Column(name = "order_no", nullable = false, unique = true, length = 30)
    private String orderNo;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(length = 30)
    private String color;

    @Column(length = 50)
    private String model;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    // 訂單為客戶/會員名稱，其他單據為供應商名稱
    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "created_at",
            insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at",
            insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}