package com.phonecase.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// 庫存：inventory 資料表與其他單據共用英文欄位名稱（中文名稱寫在欄位註解）
// 入庫單、出庫單以 品名 + 型號 + 顏色 找到對應的品項
@Entity
@Table(name = "inventory")
@Getter
@Setter
public class Inventory extends BaseDocument {

    // 品號（前端欄位名稱為 orderNo）
    @Id
    @Column(name = "product_no", length = 50)
    private String orderNo;

    // 安全庫存量
    @Column(name = "safety_stock", nullable = false)
    private Integer safetyStock = 0;

    // 狀態
    @Column(length = 20)
    private String status;

    // 庫存的品號就是主鍵，回傳與 orderNo 相同的值
    @Override
    public String getProductNo() {
        return orderNo;
    }

    // 庫存的品號是主鍵，只能在新增時以 setOrderNo 設定，避免修改時改到主鍵
    @Override
    public void setProductNo(String productNo) {
        throw new UnsupportedOperationException("庫存的品號為主鍵，請使用 setOrderNo");
    }
}
