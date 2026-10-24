package com.phonecase.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// 入庫單：唯一可以增加庫存的單據
@Entity
@Table(name = "stock_in")
@Getter
@Setter
public class StockIn extends BaseDocument {

    // 入庫單編號 (YYMMDDNNNN)
    @Id
    @Column(name = "stockin_no", length = 10)
    private String orderNo;

    // 對應的採購單編號（外鍵 → purchase_order.purchase_no）
    @Column(name = "purchase_no", nullable = false, length = 10)
    private String purchaseNo;

    // 建立人（倉庫員工帳號），後台尚未有登入功能，先預設為 admin
    @Column(nullable = false, length = 50)
    private String creator = "admin";

    // 審核人（倉庫主管帳號）
    @Column(length = 50)
    private String reviewer;
}