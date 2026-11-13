package com.phonecase.backend.repository;

import com.phonecase.backend.entity.StockOut;

public interface StockOutRepository extends DocumentRepository<StockOut> {

    // 刪除訂單前檢查是否已有出庫單引用
    boolean existsBySalesOrderNo(String salesOrderNo);
}