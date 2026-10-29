-- 商城訂單同步的後台訂單，訂單編號直接使用商城訂單編號：order.order_number + '-' + 明細序號
--   例如 ORDc8cd8a216f804569a4d85699-1；一張商城訂單有 2 個明細時為 CL202610260001-1、CL202610260001-2
-- 後台手動建立的訂單維持 YYMMDDNNNN
-- 訂單日期改存在 sales_order.order_date（銷售統計、訂單異常、CRM 不再從訂單編號前 6 碼取得日期）
-- 執行：mysql -u root --default-character-set=utf8mb4 phonecase_test < backend/sql/2026-10-29-sales-order-shop-order-no.sql

SET NAMES utf8mb4;

-- 1. 移除 shop_order_number（若曾經新增過）
SET @has_column = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order' AND COLUMN_NAME = 'shop_order_number');
SET @sql = IF(@has_column = 1, 'ALTER TABLE sales_order DROP COLUMN shop_order_number', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 新增訂單日期
SET @has_column = (SELECT COUNT(*) FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sales_order' AND COLUMN_NAME = 'order_date');
SET @sql = IF(@has_column = 0,
              'ALTER TABLE sales_order ADD COLUMN order_date datetime DEFAULT NULL COMMENT ''訂單日期'' AFTER order_no',
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 匯入訂單日期：商城訂單取下單時間，後台訂單取訂單編號前 6 碼，其餘取更新時間（保留原本的更新時間）
UPDATE sales_order s
JOIN order_item oi ON oi.id = s.source_order_item_id
JOIN `order` o ON o.id = oi.order_id
SET s.order_date = o.created_at, s.updated_at = s.updated_at
WHERE s.order_date IS NULL;

UPDATE sales_order
SET order_date = STR_TO_DATE(LEFT(order_no, 6), '%y%m%d'), updated_at = updated_at
WHERE order_date IS NULL AND order_no REGEXP '^[0-9]{6}';

UPDATE sales_order SET order_date = updated_at, updated_at = updated_at WHERE order_date IS NULL;

ALTER TABLE sales_order
  MODIFY order_date datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '訂單日期',
  ADD KEY idx_sales_order_order_date (order_date);

-- 3. 訂單編號加長（出庫單的對應訂單編號一起加長），外鍵改為隨訂單編號更新
SET @fk = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_out' AND COLUMN_NAME = 'sales_order_no'
             AND REFERENCED_TABLE_NAME = 'sales_order' LIMIT 1);
SET @sql = IF(@fk IS NULL, 'SELECT 1', CONCAT('ALTER TABLE stock_out DROP FOREIGN KEY `', @fk, '`'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE sales_order MODIFY order_no varchar(40) NOT NULL COMMENT '訂單編號（後台 YYMMDDNNNN／商城 商城訂單編號-明細序號）';
ALTER TABLE stock_out MODIFY sales_order_no varchar(40) NOT NULL COMMENT '訂單編號';
ALTER TABLE stock_out
  ADD CONSTRAINT stock_out_ibfk_1 FOREIGN KEY (sales_order_no) REFERENCES sales_order (order_no) ON UPDATE CASCADE;

-- 4. 既有的商城訂單改用商城訂單編號（明細序號 = 同一張訂單中依明細 id 排序的順序）
UPDATE sales_order s
JOIN order_item oi ON oi.id = s.source_order_item_id
JOIN `order` o ON o.id = oi.order_id
SET s.order_no = CONCAT(o.order_number, '-',
                        (SELECT COUNT(*) FROM order_item x WHERE x.order_id = oi.order_id AND x.id <= oi.id)),
    s.updated_at = s.updated_at;
