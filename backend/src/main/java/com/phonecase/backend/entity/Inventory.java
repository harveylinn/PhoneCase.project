package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// 庫存：inventory 資料表為中文欄位，將共用欄位改對應到中文欄位名稱
// 入庫單、出庫單以 品名 + 型號 + 顏色 找到對應的品項
@Entity
@Table(name = "inventory")
@AttributeOverride(name = "productName", column = @Column(name = "`品名`", nullable = false, length = 100))
@AttributeOverride(name = "color", column = @Column(name = "`顏色`", length = 30))
@AttributeOverride(name = "model", column = @Column(name = "`型號`", length = 50))
@AttributeOverride(name = "quantity", column = @Column(name = "`數量`", nullable = false))
@AttributeOverride(name = "unitPrice", column = @Column(name = "`單價`", nullable = false))
@AttributeOverride(name = "totalPrice", column = @Column(name = "`總計`"))
@AttributeOverride(name = "customerName", column = @Column(name = "`供應商名稱`", length = 100))
@AttributeOverride(name = "customerId", column = @Column(name = "`供應商代號`", length = 20))
@AttributeOverride(name = "updatedAt", column = @Column(name = "`更新時間`", insertable = false, updatable = false))
@Getter
@Setter
public class Inventory extends BaseDocument {

    // 品號（前端欄位名稱為 orderNo）
    @Id
    @Column(name = "`品號`", length = 50)
    private String orderNo;

    @Column(name = "`品牌`", length = 50)
    private String brand;

    @Column(name = "`安全庫存量`", nullable = false)
    private Integer safetyStock = 0;

    @Column(name = "`狀態`", length = 20)
    private String status;
}