package com.phonecase.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// 訂單
@Entity
@Table(name = "sales_order")
@Getter
@Setter
public class SalesOrder extends BaseDocument {

    // 訂單編號：後台建立為 YYMMDDNNNN；商城同步為 商城訂單編號-明細序號（例如 ORDc8cd8a216f804569a4d85699-1）
    @Id
    @Column(name = "order_no", length = 40)
    private String orderNo;

    // 訂單日期（銷售統計、訂單異常報告、CRM 以此計算）
    @Column(name = "order_date", nullable = false, updatable = false)
    private LocalDateTime orderDate;

    // 品號
    @Column(name = "product_no", nullable = false, length = 50)
    private String productNo;

    @Column(nullable = false, length = 20)
    private String status = "待處理";

    // 來源商城訂單明細（order_item.id），由 ShopSyncService 寫入；後台建立的訂單為 null
    @Column(name = "source_order_item_id", insertable = false, updatable = false)
    private Long sourceOrderItemId;
}
