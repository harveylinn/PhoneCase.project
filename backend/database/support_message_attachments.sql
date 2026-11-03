-- 客服圖片訊息欄位。舊資料表請執行一次；新建資料表請使用 support-schema.sql。
ALTER TABLE support_messages
    MODIFY COLUMN message TEXT NULL,
    ADD COLUMN attachment_data_url LONGTEXT NULL;
