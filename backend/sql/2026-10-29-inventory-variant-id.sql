-- inventory.product_variant_id：關聯商城規格 product_variants.id
-- 以 SKU（product_variants.sku = inventory.product_no）匯入既有資料，之後由 ShopSyncService 維護
-- 執行：mysql -u root --default-character-set=utf8mb4 phonecase_test < backend/sql/2026-10-29-inventory-variant-id.sql

SET NAMES utf8mb4;

-- 欄位已存在時略過新增
SET @has_column = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory' AND COLUMN_NAME = 'product_variant_id');
SET @sql = IF(@has_column = 0,
              'ALTER TABLE inventory ADD COLUMN product_variant_id bigint(20) DEFAULT NULL COMMENT ''對應 product_variants.id''',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 匯入既有資料（保留原本的更新時間，避免影響庫存數量的同步判斷）
UPDATE inventory i
JOIN product_variants v ON v.sku = i.product_no
SET i.product_variant_id = v.id, i.updated_at = i.updated_at;

-- 一個規格只對應一筆庫存；規格刪除時保留庫存，只清空對應
ALTER TABLE inventory
  ADD UNIQUE KEY uk_inventory_variant (product_variant_id),
  ADD CONSTRAINT fk_inventory_variant FOREIGN KEY (product_variant_id)
      REFERENCES product_variants (id) ON DELETE SET NULL;
