USE phonecaseshop;

START TRANSACTION;

-- AirX：霧面、簡約、磁吸環、輕量外觀
UPDATE product_variants
SET tags = '簡約,霧面,磁吸,輕薄'
WHERE sku LIKE 'AIRX-%';

-- Solid：整片霧面、低調、經典外觀
UPDATE product_variants
SET tags = '經典,低調,霧面,簡約'
WHERE sku LIKE 'SOLID-%';

-- Clear：透明殼、可看到手機本體、磁吸環
UPDATE product_variants
SET tags = '透明,簡約,磁吸,清透'
WHERE sku LIKE 'CLEAR-%';

-- Mod NX：深色邊框、磁吸環、模組化外觀
UPDATE product_variants
SET tags = '模組化,磁吸,機能,深色'
WHERE sku LIKE 'MODNX-%';

-- Bumper：明顯邊框、透明背板、淺色外觀
UPDATE product_variants
SET tags = '邊框,透明,淺色,輕量'
WHERE sku LIKE 'BUMPER-%';

-- ClearX：透明、輕薄、簡潔、磁吸環
UPDATE product_variants
SET tags = '透明,輕薄,簡約,磁吸'
WHERE sku LIKE 'CLEARX-%';

COMMIT;

-- 執行後確認每筆規格的標籤
SELECT id, sku, model, color, tags
FROM product_variants
ORDER BY id;
