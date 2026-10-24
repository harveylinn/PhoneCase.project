package com.phonecase.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// 出庫單：唯一可以減少庫存的單據
@Entity
@Table(name = "stock_out")
@Getter
@Setter
public class StockOut extends BaseDocument {

    // 出庫單編號 (YYMMDDNNNN)
    @Id
    @Column(name = "stockout_no", length = 10)
    private String orderNo;

    // 對應的訂單編號（外鍵 → sales_order.order_no）
    @Column(name = "sales_order_no", nullable = false, length = 10)
    private String salesOrderNo;

    // 建立人（倉庫員工帳號），後台尚未有登入功能，先預設為 admin
    @Column(nullable = false, length = 50)
    private String creator = "admin";

    // 審核人（倉庫主管帳號）
    @Column(length = 50)
    private String reviewer;
}