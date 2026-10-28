package com.phonecase.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

// 商城（商品規格、會員、商城訂單）與後台單據（庫存、訂單）的同步
// 商城的 order / order_item 目前沒有 JPA 實體（由其他組員負責），這裡以 JdbcTemplate 直接讀寫，避免重複對應同一張表
//
// 對應規則：
//   商品規格 product_variants.sku   ↔ 庫存 inventory.product_no（品名 = 商品名稱、售價 = 規格價格、狀態 = 上架 / 下架）
//   會員 members.id                 ↔ 客戶代號 M + 4 碼會員 id（例如 M0006）
//   商城訂單明細 order_item.id       → 訂單 sales_order.source_order_item_id（一個明細一張訂單）
//
// 商品頁、入庫單、出庫單異動時會即時同步；商城訂單與直接改資料庫的情況，由排程每 30 秒補同步一次
@Service
public class ShopSyncService {

    private static final Logger log = LoggerFactory.getLogger(ShopSyncService.class);

    private static final DateTimeFormatter ORDER_DATE_PREFIX = DateTimeFormatter.ofPattern("yyMMdd");

    // 商城訂單狀態（OrderService）→ 後台訂單狀態
    // PENDING_SHIPMENT：貨到付款下單、或信用卡付款完成，等待出貨
    private static final String ORDER_STATUS_CASE = """
            CASE o.order_status
                WHEN 'PENDING_SHIPMENT' THEN '處理中'
                WHEN 'PAID' THEN '處理中'
                WHEN 'SHIPPED' THEN '已出貨'
                WHEN 'COMPLETED' THEN '已完成'
                WHEN 'CANCELLED' THEN '已取消'
                ELSE '待處理'
            END""";

    // 新規格尚未有採購成本時，先以售價 40% 預估，之後可在「庫存」修改成本
    private static final String ESTIMATED_COST = "ROUND(v.price * 0.4 / 10) * 10";

    private final JdbcTemplate jdbcTemplate;

    public ShopSyncService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record SyncResult(int inventoryChanged, int ordersCreated, int ordersUpdated, int ordersRemoved) {
    }

    // 自動同步失敗只記錄錯誤，不影響後端啟動與其他 API
    @EventListener(ApplicationReadyEvent.class)
    public void syncOnStartup() {
        syncQuietly();
    }

    @Scheduled(fixedDelay = 30_000, initialDelay = 30_000)
    public void scheduledSync() {
        syncQuietly();
    }

    private void syncQuietly() {
        try {
            syncAll();
        } catch (RuntimeException e) {
            log.error("商城資料同步失敗", e);
        }
    }

    // 全部同步：商品規格 → 庫存、庫存數量雙向、商城訂單 → 訂單
    @Transactional
    public synchronized SyncResult syncAll() {
        int inventoryChanged = syncAllVariants();
        int ordersCreated = createMissingSalesOrders();
        int ordersUpdated = updateLinkedSalesOrders();
        int ordersRemoved = removeOrphanSalesOrders();
        return new SyncResult(inventoryChanged, ordersCreated, ordersUpdated, ordersRemoved);
    }

    // 商品頁新增、修改規格後呼叫
    @Transactional
    public synchronized void syncVariant(Long variantId) {
        jdbcTemplate.update(insertMissingInventorySql("AND v.id = ?"), variantId);
        jdbcTemplate.update(updateInventoryFromVariantSql("AND v.id = ?"), variantId);
        // 商品頁剛修改的庫存數量為最新資料
        jdbcTemplate.update("""
                UPDATE inventory i JOIN product_variants v ON v.sku = i.product_no
                SET i.quantity = v.stock, i.total_price = v.stock * i.unit_price
                WHERE v.id = ? AND i.quantity <> v.stock
                """, variantId);
    }

    // 商品頁修改商品名稱、上下架後呼叫（同一商品的全部規格）
    @Transactional
    public synchronized void syncProduct(Long productId) {
        jdbcTemplate.update(insertMissingInventorySql("AND p.id = ?"), productId);
        jdbcTemplate.update(updateInventoryFromVariantSql("AND p.id = ?"), productId);
    }

    // 商品規格刪除後呼叫：保留庫存與單據紀錄，只清空狀態（不在商城販售）
    @Transactional
    public synchronized void unlinkSkus(List<String> skus) {
        for (String sku : skus) {
            jdbcTemplate.update("""
                    UPDATE inventory SET status = NULL
                    WHERE product_no = ?
                      AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = inventory.product_no)
                    """, sku);
        }
    }

    // 入庫單、出庫單、後台「庫存」異動數量後呼叫：同步商品規格的庫存
    public void pushStockToVariant(String sku, int quantity) {
        jdbcTemplate.update(
                "UPDATE product_variants SET stock = ? WHERE sku = ? AND stock <> ?",
                quantity, sku, quantity);
    }

    public boolean isShopSku(String sku) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM product_variants WHERE sku = ?", Integer.class, sku);
        return count != null && count > 0;
    }

    // 客戶名稱對應到唯一一位會員時回傳客戶代號；同名或找不到時回傳 null
    public String findCustomerCode(String customerName) {
        if (customerName == null || customerName.isBlank()) {
            return null;
        }
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT id FROM members WHERE name = ? AND role = 'CUSTOMER'", Long.class, customerName.trim());
        return ids.size() == 1 ? customerCodeOf(ids.get(0)) : null;
    }

    public static String customerCodeOf(long memberId) {
        return "M" + String.format("%04d", memberId);
    }

    private int syncAllVariants() {
        int changed = jdbcTemplate.update(insertMissingInventorySql(""));

        // 庫存數量：以較晚更新的一方為準（同時間以後台庫存為準）
        changed += jdbcTemplate.update("""
                UPDATE inventory i JOIN product_variants v ON v.sku = i.product_no
                SET i.quantity = v.stock, i.total_price = v.stock * i.unit_price
                WHERE i.quantity <> v.stock AND v.updated_at > i.updated_at
                """);
        changed += jdbcTemplate.update("""
                UPDATE product_variants v JOIN inventory i ON i.product_no = v.sku
                SET v.stock = i.quantity
                WHERE v.stock <> i.quantity
                """);

        changed += jdbcTemplate.update(updateInventoryFromVariantSql(""));

        // 商城已刪除的規格：保留庫存，只清空狀態
        changed += jdbcTemplate.update("""
                UPDATE inventory SET status = NULL
                WHERE status IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = inventory.product_no)
                """);
        return changed;
    }

    private String insertMissingInventorySql(String condition) {
        return """
                INSERT INTO inventory (product_name, product_no, brand, color, model, quantity,
                                       unit_price, sale_price, total_price, safety_stock, status)
                SELECT p.name, v.sku, v.brand, v.color, v.model, v.stock,
                       %1$s, ROUND(v.price), v.stock * %1$s, 10,
                       CASE WHEN p.status = '下架' THEN '下架' ELSE v.status END
                FROM product_variants v JOIN products p ON p.id = v.product_id
                WHERE NOT EXISTS (SELECT 1 FROM inventory i WHERE i.product_no = v.sku) %2$s
                """.formatted(ESTIMATED_COST, condition);
    }

    // 品名、品牌、型號、顏色、售價、狀態以商品頁為準（數量另外處理）
    private String updateInventoryFromVariantSql(String condition) {
        return """
                UPDATE inventory i
                JOIN product_variants v ON v.sku = i.product_no
                JOIN products p ON p.id = v.product_id
                SET i.product_name = p.name, i.brand = v.brand, i.model = v.model, i.color = v.color,
                    i.sale_price = ROUND(v.price),
                    i.status = CASE WHEN p.status = '下架' THEN '下架' ELSE v.status END
                WHERE NOT (i.product_name <=> p.name AND i.brand <=> v.brand AND i.model <=> v.model
                           AND i.color <=> v.color AND i.sale_price <=> ROUND(v.price)
                           AND i.status <=> CASE WHEN p.status = '下架' THEN '下架' ELSE v.status END) %s
                """.formatted(condition);
    }

    // 商城訂單明細尚未建立後台訂單的，依下單日期產生 YYMMDDNNNN 訂單編號
    private int createMissingSalesOrders() {
        List<Map<String, Object>> items = jdbcTemplate.queryForList("""
                SELECT oi.id, oi.product_name, oi.model_name, oi.color, oi.unit_price, oi.quantity, oi.line_total,
                       o.created_at, o.member_id, m.name AS member_name,
                       %s AS status,
                       (SELECT v.sku FROM product_variants v JOIN products p ON p.id = v.product_id
                        WHERE p.name = oi.product_name AND v.model = oi.model_name AND v.color <=> oi.color
                        LIMIT 1) AS sku,
                       (SELECT v.brand FROM product_variants v JOIN products p ON p.id = v.product_id
                        WHERE p.name = oi.product_name AND v.model = oi.model_name AND v.color <=> oi.color
                        LIMIT 1) AS brand
                FROM order_item oi
                JOIN `order` o ON o.id = oi.order_id
                LEFT JOIN members m ON m.id = o.member_id
                WHERE NOT EXISTS (SELECT 1 FROM sales_order s WHERE s.source_order_item_id = oi.id)
                ORDER BY o.created_at, oi.id
                """.formatted(ORDER_STATUS_CASE));

        for (Map<String, Object> item : items) {
            Object createdAt = item.get("created_at");
            LocalDateTime orderTime = createdAt instanceof Timestamp timestamp
                    ? timestamp.toLocalDateTime()
                    : (LocalDateTime) createdAt;
            String orderNo = nextOrderNo(orderTime.format(ORDER_DATE_PREFIX));
            Object sku = item.get("sku");
            long memberId = ((Number) item.get("member_id")).longValue();

            jdbcTemplate.update("""
                    INSERT INTO sales_order (order_no, product_name, product_no, brand, color, model, quantity,
                                             unit_price, total_price, supplier_name, supplier_id, status,
                                             source_order_item_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    orderNo,
                    item.get("product_name"),
                    sku != null ? sku : "SHOP-" + item.get("id"),
                    item.get("brand"),
                    item.get("color"),
                    item.get("model_name"),
                    item.get("quantity"),
                    ((Number) item.get("unit_price")).intValue(),
                    ((Number) item.get("line_total")).intValue(),
                    item.get("member_name"),
                    customerCodeOf(memberId),
                    item.get("status"),
                    item.get("id"));
        }
        return items.size();
    }

    // 商城訂單狀態、會員姓名變更時同步到後台訂單
    // members 使用 utf8mb4_unicode_ci、sales_order 使用 utf8mb4_general_ci，比對時需指定排序規則
    private int updateLinkedSalesOrders() {
        return jdbcTemplate.update("""
                UPDATE sales_order s
                JOIN order_item oi ON oi.id = s.source_order_item_id
                JOIN `order` o ON o.id = oi.order_id
                LEFT JOIN members m ON m.id = o.member_id
                SET s.status = %1$s, s.supplier_name = m.name
                WHERE NOT (s.status <=> %1$s
                           AND s.supplier_name <=> m.name COLLATE utf8mb4_general_ci)
                """.formatted(ORDER_STATUS_CASE));
    }

    // 商城訂單已刪除：沒有出庫單的後台訂單一起刪除；已出庫的保留紀錄
    private int removeOrphanSalesOrders() {
        return jdbcTemplate.update("""
                DELETE FROM sales_order
                WHERE source_order_item_id IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM order_item oi WHERE oi.id = sales_order.source_order_item_id)
                  AND NOT EXISTS (SELECT 1 FROM stock_out so WHERE so.sales_order_no = sales_order.order_no)
                """);
    }

    private String nextOrderNo(String datePrefix) {
        Set<String> used = new HashSet<>(jdbcTemplate.queryForList(
                "SELECT order_no FROM sales_order WHERE order_no LIKE ?", String.class, datePrefix + "%"));
        for (int seq = 1; seq <= 9999; seq++) {
            String orderNo = datePrefix + String.format("%04d", seq);
            if (!used.contains(orderNo)) {
                return orderNo;
            }
        }
        throw new IllegalStateException("訂單編號已用完：" + datePrefix);
    }
}
