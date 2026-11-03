package com.phonecase.backend.cart.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

// 記錄哪些合併請求已經執行成功
@Entity
@Table(
        name = "cart_merge_records",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cart_merge_id",
                        columnNames = {"merge_id"}
                )
        }
)
@Getter
@Setter
public class CartMergeRecord {

    // 資料庫自動產生流水號
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 一次合併操作的唯一識別碼
    @Column(
            name = "merge_id",
            nullable = false,
            length = 36
    )
    private String mergeId;

    // 本次合併所屬的會員
    @Column(
            name = "member_id",
            nullable = false
    )
    private Long memberId;

    // 記錄請求內容的雜湊值
    // 後續用來防止同一 mergeId 搭配不同商品資料
    @Column(
            name = "request_hash",
            nullable = false,
            length = 64
    )
    private String requestHash;

    // 成功合併的時間
    @Column(
            name = "created_at",
            nullable = false
    )
    private LocalDateTime createdAt;

    @PrePersist
    public void beforeInsert() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}