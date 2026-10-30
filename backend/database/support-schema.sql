-- 人工客服案件與訊息資料表。
-- ddl-auto 已設定為 none，請在 phonecaseshop 資料庫手動執行本腳本。
CREATE TABLE IF NOT EXISTS support_conversations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NULL,
    guest_id VARCHAR(100) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_support_conversations_member (member_id),
    INDEX idx_support_conversations_guest (guest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人工客服案件';

CREATE TABLE IF NOT EXISTS support_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_support_messages_conversation (conversation_id),
    CONSTRAINT fk_support_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='人工客服訊息';
