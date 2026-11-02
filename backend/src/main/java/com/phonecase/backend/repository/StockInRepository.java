package com.phonecase.backend.repository;

import com.phonecase.backend.entity.StockIn;

public interface StockInRepository extends DocumentRepository<StockIn> {

    // 刪除採購單前檢查是否已有入庫單引用
    boolean existsByPurchaseNo(String purchaseNo);
}