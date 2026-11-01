package com.phonecase.backend.service;

import com.phonecase.backend.entity.StockOut;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.repository.StockOutRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

// 後台管理頁面：總覽、商城訂單管理、會員管理、未上架商品上架
// 商城訂單（order / order_item）狀態以 OrderEntity 修改，觸發 ShopOrderSyncListener 即時同步後台訂單 sales_order
// 商城訂單「出貨」時，為每個明細對應的後台訂單自動建立出庫單並扣庫存（與手動出庫單相同的扣法）
@Service
public class AdminShopService {

    // 訂單篩選：all 所有訂單、unpaid 未結帳、unshipped 未出貨、unpicked 未取貨（已出貨、尚未完成）
    private static final Map<String, List<String>> ORDER_FILTERS = Map.of(
            "unpaid", List.of("PENDING_PAYMENT"),
            "unshipped", List.of("PENDING_SHIPMENT", "PAID"),
            "unpicked", List.of("SHIPPED"));

    // 後台可以變更的訂單狀態：目標狀態 → 允許的目前狀態
    private static final Map<String, Set<String>> ORDER_TRANSITIONS = Map.of(
            "SHIPPED", Set.of("PENDING_SHIPMENT", "PAID"),
            "COMPLETED", Set.of("SHIPPED"),
            "CANCELLED", Set.of("PENDING_PAYMENT", "PENDING_SHIPMENT", "PAID"));

    private static final Set<String> MEMBER_STATUSES = Set.of("ACTIVE", "SUSPENDED");

    // 營業額不計入已取消、尚未付款的訂單
    private static final String REVENUE_EXCLUDED = "'CANCELLED', 'PENDING_PAYMENT'";

    public record Overview(long todayOrders, long monthRevenue, long productCount, long memberCount,
            List<ShopOrder> recentOrders) {
    }

    public record ShopOrder(long id, String orderNumber, Long memberId, String memberName,
            String receiverName, String receiverPhone, String shippingMethod, String storeName,
            String receiverAddress, String paymentMethod, long totalAmount, String orderStatus,
            LocalDateTime createdAt, long itemCount, String items) {
    }

    // price 售價；productId 商品系列（沒有對應商城規格時使用，未填則以品名找商品系列，找不到就新增）
    // imageUrls 商品圖片路徑（可多張，依順序排列；規格還沒有主圖時，第一張設為主圖）
    public record PublishRequest(BigDecimal price, Long productId, List<String> imageUrls) {
    }

    private static final int IMAGE_URL_MAX_LENGTH = 500;

    // 出庫單編號 YYMMDDNNNN（以出貨當天日期編號）
    private static final DateTimeFormatter STOCK_OUT_DATE_PREFIX = DateTimeFormatter.ofPattern("yyMMdd");

    // stockOutNos：這次出貨自動建立的出庫單編號（其他狀態變更為空）
    public record StatusChangeResult(String orderNumber, String orderStatus, List<String> stockOutNos) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final OrderRepository orderRepository;
    private final ShopSyncService shopSyncService;
    private final InventoryService inventoryService;
    private final StockOutRepository stockOutRepository;

    public AdminShopService(JdbcTemplate jdbcTemplate, OrderRepository orderRepository,
            ShopSyncService shopSyncService, InventoryService inventoryService,
            StockOutRepository stockOutRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.orderRepository = orderRepository;
        this.shopSyncService = shopSyncService;
        this.inventoryService = inventoryService;
        this.stockOutRepository = stockOutRepository;
    }

    // date 為瀏覽器日期
    public Overview getOverview(LocalDate date) {
        LocalDate monthStart = date.withDayOfMonth(1);
        long todayOrders = count("""
                SELECT COUNT(*) FROM `order`
                WHERE created_at >= ? AND created_at < ? AND order_status <> 'CANCELLED'
                """, date, date.plusDays(1));
        long monthRevenue = count("""
                SELECT COALESCE(SUM(total_amount), 0) FROM `order`
                WHERE created_at >= ? AND created_at < ? AND order_status NOT IN (%s)
                """.formatted(REVENUE_EXCLUDED), monthStart, monthStart.plusMonths(1));
        long productCount = count("SELECT COUNT(*) FROM products");
        long memberCount = count("SELECT COUNT(*) FROM members WHERE role = 'CUSTOMER'");
        return new Overview(todayOrders, monthRevenue, productCount, memberCount, queryOrders("", 5));
    }

    public List<ShopOrder> getOrders(String filter) {
        if (filter == null || filter.isBlank() || "all".equals(filter)) {
            return queryOrders("", 0);
        }
        List<String> statuses = ORDER_FILTERS.get(filter);
        if (statuses == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "訂單篩選只能是 all、unpaid、unshipped、unpicked");
        }
        String inList = String.join(", ", statuses.stream().map(status -> "'" + status + "'").toList());
        return queryOrders("WHERE o.order_status IN (" + inList + ")", 0);
    }

    // 出貨時自動建立出庫單：庫存不足或品號不在庫存時整筆回滾，訂單維持未出貨
    // adminId 為操作的管理員（寫入出庫單建立人）
    @Transactional
    public synchronized StatusChangeResult updateOrderStatus(Long orderId, String status, Long adminId) {
        Set<String> allowedFrom = ORDER_TRANSITIONS.get(status);
        if (allowedFrom == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "訂單狀態只能改為 SHIPPED、COMPLETED 或 CANCELLED");
        }
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到訂單 id = " + orderId));
        if (!allowedFrom.contains(order.getOrderStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "訂單 " + order.getOrderNumber() + " 目前狀態為 " + order.getOrderStatus() + "，無法改為 " + status);
        }
        order.setOrderStatus(status);
        orderRepository.saveAndFlush(order);

        List<String> stockOutNos = "SHIPPED".equals(status)
                ? createShippingStockOuts(orderId, creatorOf(adminId))
                : List.of();
        return new StatusChangeResult(order.getOrderNumber(), status, stockOutNos);
    }

    // 為這張商城訂單每個明細對應的後台訂單建立出庫單；已經有出庫單（例如手動建立）的明細略過，不重複扣庫存
    private List<String> createShippingStockOuts(Long orderId, String creator) {
        // 先補齊後台訂單（即時同步失敗時，這裡仍能找到每個明細的 sales_order）
        shopSyncService.syncShopOrders();
        List<Map<String, Object>> lines = jdbcTemplate.queryForList("""
                SELECT s.order_no, s.product_name, s.product_no, s.brand, s.color, s.model,
                       s.quantity, s.unit_price, s.supplier_name, s.supplier_id
                FROM sales_order s
                JOIN order_item oi ON oi.id = s.source_order_item_id
                WHERE oi.order_id = ?
                  AND NOT EXISTS (SELECT 1 FROM stock_out so WHERE so.sales_order_no = s.order_no)
                ORDER BY oi.id
                """, orderId);

        List<String> stockOutNos = new ArrayList<>();
        for (Map<String, Object> line : lines) {
            String productNo = (String) line.get("product_no");
            int quantity = ((Number) line.get("quantity")).intValue();
            int unitPrice = ((Number) line.get("unit_price")).intValue();
            // 與手動出庫單相同：以品號原子扣庫存，不足時拋出 409
            inventoryService.changeQuantity(productNo, -quantity);

            StockOut stockOut = new StockOut();
            stockOut.setOrderNo(nextStockOutNo());
            stockOut.setSalesOrderNo((String) line.get("order_no"));
            stockOut.setProductName((String) line.get("product_name"));
            stockOut.setProductNo(productNo);
            stockOut.setBrand((String) line.get("brand"));
            stockOut.setColor((String) line.get("color"));
            stockOut.setModel((String) line.get("model"));
            stockOut.setQuantity(quantity);
            stockOut.setUnitPrice(unitPrice);
            stockOut.setTotalPrice(quantity * unitPrice);
            stockOut.setCustomerName((String) line.get("supplier_name"));
            stockOut.setCustomerId((String) line.get("supplier_id"));
            stockOut.setCreator(creator);
            stockOutRepository.saveAndFlush(stockOut);
            stockOutNos.add(stockOut.getOrderNo());
        }
        return stockOutNos;
    }

    // 下一個出庫單編號：今天日期 + 4 碼流水號，接在今天已用的最大編號之後（手動建立的出庫單也算在內）
    private String nextStockOutNo() {
        String prefix = LocalDate.now().format(STOCK_OUT_DATE_PREFIX);
        String max = jdbcTemplate.queryForObject(
                "SELECT MAX(stockout_no) FROM stock_out WHERE stockout_no LIKE ? AND stockout_no REGEXP '^[0-9]{10}$'",
                String.class, prefix + "%");
        int next = max == null ? 1 : Integer.parseInt(max.substring(6)) + 1;
        if (next > 9999) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "今天的出庫單編號已用完：" + prefix);
        }
        return prefix + String.format("%04d", next);
    }

    // 出庫單建立人：操作的管理員帳號（找不到時沿用預設 admin）
    private String creatorOf(Long adminId) {
        if (adminId == null) {
            return "admin";
        }
        List<String> accounts = jdbcTemplate.queryForList(
                "SELECT account FROM members WHERE id = ?", String.class, adminId);
        return accounts.isEmpty() ? "admin" : accounts.get(0);
    }

    public void updateMemberStatus(Long memberId, String status) {
        if (!MEMBER_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "會員狀態只能是 ACTIVE 或 SUSPENDED");
        }
        int updated = jdbcTemplate.update(
                "UPDATE members SET status = ? WHERE id = ? AND role = 'CUSTOMER'", status, memberId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到會員 id = " + memberId);
        }
    }

    // 庫存品項上架：有對應商城規格就填入售價並上架；沒有就在商品系列下新增規格（SKU = 品號）
    @Transactional
    public void publishInventory(String productNo, PublishRequest request) {
        if (request.price() == null || request.price().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "售價必須大於 0");
        }
        List<String> imageUrls = request.imageUrls() == null ? List.of() : request.imageUrls().stream()
                .filter(url -> url != null && !url.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        for (String url : imageUrls) {
            if (url.length() > IMAGE_URL_MAX_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "圖片路徑長度不可超過 " + IMAGE_URL_MAX_LENGTH + " 字：" + url.substring(0, 40) + "…");
            }
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT product_name, brand, model, color, quantity FROM inventory WHERE product_no = ?", productNo);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "庫存中找不到品號：" + productNo);
        }
        Map<String, Object> inventory = rows.get(0);

        List<Map<String, Object>> variants = jdbcTemplate.queryForList(
                "SELECT id, product_id FROM product_variants WHERE sku = ?", productNo);
        long variantId;
        if (!variants.isEmpty()) {
            variantId = ((Number) variants.get(0).get("id")).longValue();
            long productId = ((Number) variants.get(0).get("product_id")).longValue();
            jdbcTemplate.update("UPDATE product_variants SET price = ?, status = '上架' WHERE id = ?",
                    request.price(), variantId);
            jdbcTemplate.update("UPDATE products SET status = '上架' WHERE id = ?", productId);
        } else {
            long productId = request.productId() != null
                    ? requireProduct(request.productId())
                    : findOrCreateProduct((String) inventory.get("product_name"));
            variantId = insertVariant(productId, productNo, inventory, request.price());
            jdbcTemplate.update("UPDATE products SET status = '上架' WHERE id = ?", productId);
        }
        addImages(variantId, imageUrls);
        shopSyncService.syncVariant(variantId);
    }

    // 圖片接在規格既有圖片之後；已存在的路徑略過；規格還沒有主圖時，第一張新圖片設為主圖
    private void addImages(long variantId, List<String> imageUrls) {
        if (imageUrls.isEmpty()) {
            return;
        }
        int nextOrder = (int) count(
                "SELECT COALESCE(MAX(sort_order), 0) FROM product_images WHERE variant_id = ?", variantId) + 1;
        boolean needPrimary = count(
                "SELECT COUNT(*) FROM product_images WHERE variant_id = ? AND is_primary = 1", variantId) == 0;
        for (String url : imageUrls) {
            if (count("SELECT COUNT(*) FROM product_images WHERE variant_id = ? AND image_url = ?", variantId, url) > 0) {
                continue;
            }
            jdbcTemplate.update(
                    "INSERT INTO product_images (variant_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)",
                    variantId, url, nextOrder++, needPrimary);
            needPrimary = false;
        }
    }

    private long requireProduct(long productId) {
        if (count("SELECT COUNT(*) FROM products WHERE id = ?", productId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "找不到商品系列 id = " + productId);
        }
        return productId;
    }

    private long findOrCreateProduct(String name) {
        List<Long> ids = jdbcTemplate.queryForList(
                "SELECT id FROM products WHERE name = ? ORDER BY id LIMIT 1", Long.class, name);
        if (!ids.isEmpty()) {
            return ids.get(0);
        }
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO products (name, category, status) VALUES (?, '手機殼', '上架')",
                    Statement.RETURN_GENERATED_KEYS);
            statement.setString(1, name);
            return statement;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    private long insertVariant(long productId, String sku, Map<String, Object> inventory, BigDecimal price) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO product_variants (product_id, brand, model, color, price, stock, sku, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, '上架')
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setLong(1, productId);
            statement.setString(2, (String) inventory.get("brand"));
            statement.setString(3, (String) inventory.get("model"));
            statement.setString(4, (String) inventory.get("color"));
            statement.setBigDecimal(5, price);
            statement.setInt(6, ((Number) inventory.get("quantity")).intValue());
            statement.setString(7, sku);
            return statement;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    // limit 為 0 時不限筆數
    private List<ShopOrder> queryOrders(String where, int limit) {
        return jdbcTemplate.query("""
                SELECT o.id, o.order_number, o.member_id, m.name AS member_name,
                       o.receiver_name, o.receiver_phone, o.shipping_method, o.store_name, o.receiver_address,
                       o.payment_method, o.total_amount, o.order_status, o.created_at,
                       COUNT(oi.id) AS item_count,
                       GROUP_CONCAT(CONCAT(oi.product_name, ' ', COALESCE(oi.model_name, ''), ' ',
                                           COALESCE(oi.color, ''), ' ×', oi.quantity)
                                    ORDER BY oi.id SEPARATOR '、') AS items
                FROM `order` o
                LEFT JOIN members m ON m.id = o.member_id
                LEFT JOIN order_item oi ON oi.order_id = o.id
                %s
                GROUP BY o.id
                ORDER BY o.created_at DESC, o.id DESC
                %s
                """.formatted(where, limit > 0 ? "LIMIT " + limit : ""), (rs, rowNum) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            long memberId = rs.getLong("member_id");
            boolean noMember = rs.wasNull();
            return new ShopOrder(
                    rs.getLong("id"),
                    rs.getString("order_number"),
                    noMember ? null : memberId,
                    rs.getString("member_name"),
                    rs.getString("receiver_name"),
                    rs.getString("receiver_phone"),
                    rs.getString("shipping_method"),
                    rs.getString("store_name"),
                    rs.getString("receiver_address"),
                    rs.getString("payment_method"),
                    rs.getBigDecimal("total_amount") == null ? 0 : rs.getBigDecimal("total_amount").longValue(),
                    rs.getString("order_status"),
                    createdAt == null ? null : createdAt.toLocalDateTime(),
                    rs.getLong("item_count"),
                    rs.getString("items"));
        });
    }

    private long count(String sql, Object... args) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class, args);
        return value == null ? 0 : value.longValue();
    }
}
