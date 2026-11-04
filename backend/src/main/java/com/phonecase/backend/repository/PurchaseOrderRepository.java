package com.phonecase.backend.repository;

import com.phonecase.backend.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PurchaseOrderRepository extends DocumentRepository<PurchaseOrder> {

    // 新增入庫單時的關聯單據選項：還沒有任何入庫單引用的採購單
    @Query("""
            SELECT p FROM PurchaseOrder p
            WHERE NOT EXISTS (SELECT 1 FROM StockIn s WHERE s.purchaseNo = p.orderNo)
            ORDER BY p.orderNo DESC
            """)
    List<PurchaseOrder> findNotStockedIn();
}
