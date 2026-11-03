-- 僅追蹤由樣本審核新增的商品圖片連結，退回時可安全解除。
-- ddl-auto=none，請在執行過 image_samples_variant_id.sql 的資料庫執行一次。
ALTER TABLE image_samples
    ADD COLUMN product_image_id BIGINT NULL;

CREATE INDEX idx_image_samples_product_image_id
    ON image_samples (product_image_id);
