-- 後台與商城（商品、會員、訂單）同步所需的資料表變更
-- 執行：mysql -u root --default-character-set=utf8mb4 phonecase_test < backend/sql/2026-10-28-admin-shop-sync.sql

SET NAMES utf8mb4;

-- inventory：單價改名為成本，新增售價；status 保留給商城判斷是否上架（上架 / 下架）
ALTER TABLE inventory MODIFY unit_price int(11) NOT NULL DEFAULT 0 COMMENT '成本';
ALTER TABLE inventory ADD COLUMN sale_price int(11) DEFAULT NULL COMMENT '售價' AFTER unit_price;
UPDATE inventory SET status = NULL, updated_at = updated_at
WHERE status IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = inventory.product_no);

-- sales_order：記錄來源商城訂單明細，商城訂單由後端自動轉入
ALTER TABLE sales_order
  ADD COLUMN source_order_item_id bigint(20) DEFAULT NULL COMMENT '來源商城訂單明細 (order_item.id)' AFTER status,
  ADD UNIQUE KEY uk_sales_order_source_item (source_order_item_id);

-- cart_items：補上主鍵、自動編號與唯一索引（CartItem 實體使用 IDENTITY 與 uk_cart_member_variant）
ALTER TABLE cart_items
  MODIFY id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ADD UNIQUE KEY uk_cart_member_variant (member_id, variant_id);

-- 客戶代號統一為 M + 4 碼會員 id（例如 M0006），對應 members.id
-- 商品規格匯入庫存、商城訂單轉入訂單由後端 ShopSyncService 在啟動時自動完成
