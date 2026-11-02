package com.phonecase.backend.repository;

import com.phonecase.backend.entity.Inventory;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryRepository
        extends DocumentRepository<Inventory> {

    // 以唯一的品號原子增減庫存（入庫單為正數、出庫單為負數），扣到負數時不更新、回傳 0
    // 單一 UPDATE 由資料庫列鎖保護，兩張出庫單同時扣同一品項也不會覆蓋彼此或扣成負數
    // total_price 寫在 quantity 之前，兩者都以更新前的數量計算（MySQL / MariaDB 皆適用）
    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE inventory
            SET total_price = (quantity + :delta) * unit_price,
                quantity = quantity + :delta
            WHERE product_no = :productNo
              AND quantity + :delta >= 0
            """, nativeQuery = true)
    int addQuantity(@Param("productNo") String productNo, @Param("delta") int delta);

    // 新增單據沒有填品號時，以 品名 + 型號 + 顏色 查庫存的品號（只讀取，不鎖定）
    // 回傳全部符合的品號，由呼叫端在多筆符合時要求填寫品號，不自行挑選其中一筆
    // <=> 為可比對 NULL 的等於（顏色、型號空白時存成 NULL）
    @Query(value = """
            SELECT product_no FROM inventory
            WHERE product_name = :productName
              AND model <=> :model
              AND color <=> :color
            ORDER BY product_no
            """, nativeQuery = true)
    List<String> findProductNos(
            @Param("productName") String productName,
            @Param("model") String model,
            @Param("color") String color);

    List<Inventory> findAllByOrderByProductNameAscModelAscColorAsc();

    // 庫存異常報告：庫存數量低於安全庫存量，缺少數量多的排前面
    @Query("""
            SELECT i FROM Inventory i
            WHERE i.quantity < i.safetyStock
            ORDER BY (i.safetyStock - i.quantity) DESC, i.orderNo
            """)
    List<Inventory> findBelowSafetyStock();
}