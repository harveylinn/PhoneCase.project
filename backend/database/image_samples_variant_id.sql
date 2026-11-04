-- 圖片樣本審核後，精確關聯到 product_variants。
-- ddl-auto=none，不會由 Spring Boot 自動建立，請在使用中的資料庫執行一次。
ALTER TABLE image_samples
    ADD COLUMN variant_id BIGINT NULL;

CREATE INDEX idx_image_samples_variant_id
    ON image_samples (variant_id);
