package com.phonecase.backend.repository;

import com.phonecase.backend.entity.Inventory;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository
        extends DocumentRepository<Inventory> {

    // 鎖住該筆庫存，避免兩張出庫單同時扣同一個品項而扣成負數
    // 使用原生 SQL 的 FOR UPDATE，MySQL 5.7 / 8 與 MariaDB 都支援
    // <=> 為可比對 NULL 的等於（顏色、型號空白時存成 NULL）
    @Query(value = """
            SELECT * FROM inventory
            WHERE product_name = :productName
              AND model <=> :model
              AND color <=> :color
            LIMIT 1
            FOR UPDATE
            """, nativeQuery = true)
    Optional<Inventory> findByProductNameAndModelAndColor(
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