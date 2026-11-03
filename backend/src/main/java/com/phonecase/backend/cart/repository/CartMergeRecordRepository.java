package com.phonecase.backend.cart.repository;

import com.phonecase.backend.cart.entity.CartMergeRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 操作購物車合併紀錄的資料庫介面
public interface CartMergeRecordRepository
        extends JpaRepository<CartMergeRecord, Long> {

    // 根據合併識別碼查詢是否已經處理
    Optional<CartMergeRecord> findByMergeId(String mergeId);
}