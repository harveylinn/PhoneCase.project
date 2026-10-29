SET NAMES utf8mb4;

-- Select the team's application database before running this script.
-- Existing tags are preserved; rerunning this script does not clear records.
SET @tags_exists = (SELECT COUNT(*) FROM information_schema.columns
 WHERE table_schema = DATABASE() AND table_name = 'product_variants' AND column_name = 'tags');
SET @tags_sql = IF(@tags_exists = 0,
 'ALTER TABLE product_variants ADD COLUMN tags VARCHAR(500) NULL', 'SELECT 1');
PREPARE tags_stmt FROM @tags_sql;
EXECUTE tags_stmt;
DEALLOCATE PREPARE tags_stmt;

CREATE TABLE IF NOT EXISTS image_samples (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 image_url VARCHAR(500) NOT NULL,
 source VARCHAR(255),
 license_type VARCHAR(100),
 license_note TEXT,
 ai_description TEXT,
 ai_match_status VARCHAR(30),
 ai_match_confidence INT,
 ai_match_reason TEXT,
 review_status VARCHAR(30) NOT NULL DEFAULT '待審核',
 reviewer_note TEXT,
 product_id BIGINT,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4;

SHOW COLUMNS FROM product_variants LIKE 'tags';
SHOW COLUMNS FROM image_samples;

-- Upgrade existing table: ai_match_status
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'image_samples' AND column_name = 'ai_match_status');
SET @upgrade_sql = IF(@column_exists = 0, 'ALTER TABLE image_samples ADD COLUMN ai_match_status VARCHAR(30) NULL', 'SELECT 1');
PREPARE upgrade_stmt FROM @upgrade_sql;
EXECUTE upgrade_stmt;
DEALLOCATE PREPARE upgrade_stmt;

-- Upgrade existing table: ai_match_confidence
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'image_samples' AND column_name = 'ai_match_confidence');
SET @upgrade_sql = IF(@column_exists = 0, 'ALTER TABLE image_samples ADD COLUMN ai_match_confidence INT NULL', 'SELECT 1');
PREPARE upgrade_stmt FROM @upgrade_sql;
EXECUTE upgrade_stmt;
DEALLOCATE PREPARE upgrade_stmt;

-- Upgrade existing table: ai_match_reason
SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'image_samples' AND column_name = 'ai_match_reason');
SET @upgrade_sql = IF(@column_exists = 0, 'ALTER TABLE image_samples ADD COLUMN ai_match_reason TEXT NULL', 'SELECT 1');
PREPARE upgrade_stmt FROM @upgrade_sql;
EXECUTE upgrade_stmt;
DEALLOCATE PREPARE upgrade_stmt;
