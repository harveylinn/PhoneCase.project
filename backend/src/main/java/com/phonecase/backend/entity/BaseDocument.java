package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// 訂單、採購單、入庫單、出庫單、庫存共用的欄位
// 單號（主鍵）在每張資料表的欄位名稱不同，由各子類別自行對應
@MappedSuperclass
@Getter
@Setter
public abstract class BaseDocument {

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(length = 50)
    private String brand;

    @Column(length = 30)
    private String color;

    @Column(length = 50)
    private String model;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Integer unitPrice;

    @Column(name = "total_price")
    private Integer totalPrice;

    // 訂單為客戶名稱，其他單據為供應商名稱（前端欄位名稱為 customerName）
    @Column(name = "supplier_name", length = 100)
    private String customerName;

    // 訂單為客戶代號，其他單據為供應商代號
    @Column(name = "supplier_id", length = 20)
    private String customerId;

    // 由資料庫自動填入（DEFAULT / ON UPDATE current_timestamp()）
    @Column(name = "updated_at",
            insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // 單號（前端欄位名稱為 orderNo），由子類別對應到各自的主鍵欄位
    public abstract String getOrderNo();

    public abstract void setOrderNo(String orderNo);

    // 品號：訂單、採購單、入庫單、出庫單對應 product_no 欄位；庫存的品號就是主鍵（orderNo）
    public abstract String getProductNo();

    public abstract void setProductNo(String productNo);
}