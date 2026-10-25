package com.phonecase.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// 採購單
@Entity
@Table(name = "purchase_order")
@Getter
@Setter
public class PurchaseOrder extends BaseDocument {

    // 採購單編號 (YYMMDDNNNN)
    @Id
    @Column(name = "purchase_no", length = 10)
    private String orderNo;

    // 品號
    @Column(name = "product_no", nullable = false, length = 50)
    private String productNo;

    // 建立人（倉庫員工帳號），後台尚未有登入功能，先預設為 admin
    @Column(nullable = false, length = 50)
    private String creator = "admin";

    // 審核人（倉庫主管帳號）
    @Column(length = 50)
    private String reviewer;
}