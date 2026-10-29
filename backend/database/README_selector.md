# Selector 整合資料庫更新

1. 先備份資料庫，在 phpMyAdmin 選擇本機專案使用的資料庫（與 application.properties 一致）。
2. 執行 selector-schema.sql，新增 tags 欄位與 image_samples 表。腳本不會清除現有商品、會員、購物車資料。
3. 若已有 image_samples 表，CREATE TABLE IF NOT EXISTS 不會修改它；請將最後列出的欄位與腳本比對，尤其 ai_match_status、ai_match_confidence、ai_match_reason，缺少時先補欄位再使用樣本功能。
4. backend/tag-updates.sql 是選用的示範標籤更新，會覆寫指定 SKU 的標籤，且寫死 phonecaseshop；使用前先確認資料庫名稱與商品資料，不需為了啟動專案而執行。
5. 新圖片樣本先上傳 Cloudinary，再貼上公開 HTTPS 圖片網址。資料庫只存網址；AI 分析時暫存記憶體，不寫入本機。舊 /images/ 樣本仍需原 uploads 檔案；不會自動搬移或刪除。刪除樣本只刪資料庫紀錄，不刪 Cloudinary 資產。圖片支援 JPG、PNG、WebP、GIF，分析大小上限 5MB。
6. AI 功能需要啟動 Ollama 並備妥 application.properties 指定的模型；一般商品及會員測試不代表 AI 環境已備妥。

驗證：商品列表可讀取、編輯品項不傳 stock 時庫存保持原值、新品項不傳 stock 時為 0、圖片樣本可新增與分析。

腳本會補齊舊 image_samples 表缺少的 ai_match_status、ai_match_confidence、ai_match_reason，不更改現有欄位或資料。SQL 檔案採 UTF-8，命令列匯入時也請使用 --default-character-set=utf8mb4。
