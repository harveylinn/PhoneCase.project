SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- 資料庫：`phonecaseshop`
--

--
-- 資料表結構 `members`
--

CREATE TABLE `members` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `account` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google_sub` varchar(255) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_members_account` (`account`),
  UNIQUE KEY `uk_members_email` (`email`),
  UNIQUE KEY `uk_members_google_sub` (`google_sub`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

--
-- 測試資料 `members`
--

INSERT INTO `members`
  (`id`, `account`, `email`, `password_hash`, `google_sub`,
   `name`, `phone`, `default_address`, `role`, `status`,
   `created_at`, `updated_at`)
VALUES
  (
    1,
    'buyer01',
    'buyer01@example.com',
    '$2a$12$zqyQ/mEWCC4kwJLDbruafOhhrTIr6t55DGcsdQcU6HU4nw5/6.A.W',
    NULL,
    '測試會員一',
    '0900000001',
    '台中市測試區範例路1號（虛構）',
    'CUSTOMER',
    'ACTIVE',
    '2026-10-26 21:59:50',
    '2026-10-26 21:59:50'
  ),
  (
    2,
    'buyer02',
    'buyer02@example.com',
    '$2a$12$ryU.eSsQC5J5IMJ.brO0te2kE3fh3dtfaMXggXjOnvWIethhy5uAC',
    NULL,
    '測試會員二',
    NULL,
    NULL,
    'CUSTOMER',
    'ACTIVE',
    '2026-10-26 21:59:50',
    '2026-10-26 21:59:50'
  ),
  (
    3,
    'buyer03',
    'buyer03@example.com',
    '$2a$12$q9ks8YauXql32Tk0Iw1b9Oa4xoIyA77IcRUGVygR2VwOsYDfdffcG',
    NULL,
    '測試會員三',
    '0900000003',
    '台北市測試區範例路3號（虛構）',
    'CUSTOMER',
    'ACTIVE',
    '2026-10-26 21:59:50',
    '2026-10-26 21:59:50'
  ),
  (
    4,
    'admin01',
    'admin01@example.com',
    '$2a$12$CMimKCzLD56Z/bmC68nvcu5gDXLMLjLbgb/qNuDvCUzCajiWT8FVO',
    NULL,
    '測試管理員',
    NULL,
    NULL,
    'ADMIN',
    'ACTIVE',
    '2026-10-26 21:59:50',
    '2026-10-26 21:59:50'
  ),
  (
    5,
    'suspended01',
    'suspended01@example.com',
    '$2a$12$JFYZMdP/maz.lQqjQriR0uMqlkEl1U03dZY/8xYAyU6CEvQq5rEda',
    NULL,
    '測試停權會員',
    NULL,
    NULL,
    'CUSTOMER',
    'SUSPENDED',
    '2026-10-26 21:59:50',
    '2026-10-26 21:59:50'
  );

COMMIT;

--
-- 檢查欄位及索引
--

SHOW COLUMNS FROM `members`;
SHOW INDEX FROM `members`;