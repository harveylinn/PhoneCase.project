package com.phonecase.backend.repository;

import com.phonecase.backend.entity.SalesOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SalesOrderRepository extends DocumentRepository<SalesOrder> {

    // 銷售統計：訂單編號格式為 YYMMDDNNNN，以前綴篩選日期
    // 今日傳 YYMMDD（例如 261025），本月傳 YYMM（例如 2610）
    @Query(value = """
            SELECT COALESCE(SUM(total_price), 0) AS amount,
                   COALESCE(SUM(quantity), 0) AS quantity,
                   COUNT(*) AS orders
            FROM sales_order
            WHERE order_no LIKE CONCAT(:prefix, '%')
            """, nativeQuery = true)
    SalesSummary summarizeByOrderNoPrefix(@Param("prefix") String prefix);

    // 最佳銷售單品：依商品分組加總銷售數量，銷售數量相同的最佳單品全部回傳
    // 品號以 品名 + 型號 + 顏色 對應庫存的品號（商品代號），庫存找不到時改用訂單上的品號
    @Query(value = """
            WITH totals AS (
                SELECT s.product_name, s.model, s.color,
                       MAX(s.product_no) AS order_product_no,
                       SUM(s.quantity) AS total_quantity
                FROM sales_order s
                WHERE s.order_no LIKE CONCAT(:prefix, '%')
                GROUP BY s.product_name, s.model, s.color
            )
            SELECT COALESCE((SELECT i.product_no FROM inventory i
                             WHERE i.product_name = t.product_name
                               AND i.model <=> t.model
                               AND i.color <=> t.color
                             LIMIT 1), t.order_product_no) AS productNo,
                   t.product_name AS productName,
                   t.total_quantity AS totalQuantity
            FROM totals t
            WHERE t.total_quantity = (SELECT MAX(total_quantity) FROM totals)
            ORDER BY productNo
            """, nativeQuery = true)
    List<BestSeller> findBestSellersByOrderNoPrefix(@Param("prefix") String prefix);

    // 銷售趨勢：依訂單編號前 length 碼分組（6 = 每日 YYMMDD、4 = 每月 YYMM），只取 from ~ to 區間
    @Query(value = """
            SELECT LEFT(order_no, :length) AS period,
                   COALESCE(SUM(total_price), 0) AS amount,
                   COALESCE(SUM(quantity), 0) AS quantity,
                   COUNT(*) AS orders
            FROM sales_order
            WHERE order_no REGEXP '^[0-9]{6}'
              AND LEFT(order_no, :length) BETWEEN :from AND :to
            GROUP BY LEFT(order_no, :length)
            ORDER BY period
            """, nativeQuery = true)
    List<SalesTrendRow> summarizeTrend(
            @Param("length") int length,
            @Param("from") String from,
            @Param("to") String to);

    // 訂單異常報告：訂單日期（訂單編號前 6 碼 YYMMDD）早於 cutoff，且狀態不是已出貨的訂單
    @Query(value = """
            SELECT * FROM sales_order
            WHERE order_no REGEXP '^[0-9]{6}'
              AND STR_TO_DATE(LEFT(order_no, 6), '%y%m%d') < :cutoff
              AND status NOT IN (:shippedStatuses)
            ORDER BY order_no
            """, nativeQuery = true)
    List<SalesOrder> findUnshippedBefore(
            @Param("cutoff") LocalDate cutoff,
            @Param("shippedStatuses") List<String> shippedStatuses);

    interface SalesSummary {
        Number getAmount();
        Number getQuantity();
        Number getOrders();
    }

    interface SalesTrendRow {
        String getPeriod();
        Number getAmount();
        Number getQuantity();
        Number getOrders();
    }

    interface BestSeller {
        String getProductNo();
        String getProductName();
        Number getTotalQuantity();
    }
}
