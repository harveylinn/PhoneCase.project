-- inventory.status：沒有狀態（不在商城販售）的庫存預設為「未上架」
-- 商品頁面上架並填入售價後，由 ShopSyncService 同步為「上架」
-- 執行：mysql -u root --default-character-set=utf8mb4 phonecase_test < backend/sql/2026-10-29-inventory-status-default.sql

SET NAMES utf8mb4;

-- 保留原本的更新時間（避免影響庫存數量的同步判斷）
UPDATE inventory SET status = '未上架', updated_at = updated_at
WHERE status IS NULL;

ALTER TABLE inventory MODIFY status varchar(20) NOT NULL DEFAULT '未上架' COMMENT '狀態（未上架 / 上架 / 下架）';
