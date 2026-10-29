package com.phonecase.backend.repository;

import com.phonecase.backend.entity.SalesOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SalesOrderRepository extends DocumentRepository<SalesOrder> {

    // 銷售統計：以訂單日期（order_date）篩選 from（含）~ to（不含）區間
    @Query(value = """
            SELECT COALESCE(SUM(total_price), 0) AS amount,
                   COALESCE(SUM(quantity), 0) AS quantity,
                   COUNT(*) AS orders
            FROM sales_order
            WHERE order_date >= :from AND order_date < :to
            """, nativeQuery = true)
    SalesSummary summarizeBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // 最佳銷售單品：依商品分組加總銷售數量，銷售數量相同的最佳單品全部回傳
    // 直接以訂單上的品號（sales_order.product_no，不可空白）分組
    // MySQL 5.7 不支援 WITH，最大銷售數量以子查詢取得
    @Query(value = """
            SELECT product_no AS productNo,
                   MAX(product_name) AS productName,
                   SUM(quantity) AS totalQuantity
            FROM sales_order
            WHERE order_date >= :from AND order_date < :to
            GROUP BY product_no
            HAVING totalQuantity = (
                SELECT MAX(t.total_quantity) FROM (
                    SELECT SUM(quantity) AS total_quantity
                    FROM sales_order
                    WHERE order_date >= :from AND order_date < :to
                    GROUP BY product_no
                ) t
            )
            ORDER BY productNo
            """, nativeQuery = true)
    List<BestSeller> findBestSellersBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    // 銷售趨勢：依訂單日期分組（format = '%y%m%d' 每日 YYMMDD、'%y%m' 每月 YYMM），只取 from ~ to 區間
    @Query(value = """
            SELECT DATE_FORMAT(order_date, :format) AS period,
                   COALESCE(SUM(total_price), 0) AS amount,
                   COALESCE(SUM(quantity), 0) AS quantity,
                   COUNT(*) AS orders
            FROM sales_order
            WHERE DATE_FORMAT(order_date, :format) BETWEEN :from AND :to
            GROUP BY DATE_FORMAT(order_date, :format)
            ORDER BY period
            """, nativeQuery = true)
    List<SalesTrendRow> summarizeTrend(
            @Param("format") String format,
            @Param("from") String from,
            @Param("to") String to);

    // 訂單異常報告：訂單日期早於 cutoff，且狀態不是已出貨的訂單
    @Query(value = """
            SELECT * FROM sales_order
            WHERE order_date < :cutoff
              AND status NOT IN (:shippedStatuses)
            ORDER BY order_date, order_no
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
