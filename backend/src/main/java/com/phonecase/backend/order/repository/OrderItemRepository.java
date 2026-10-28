package com.phonecase.backend.order.repository;

import com.phonecase.backend.order.entity.OrderItemEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository
        extends JpaRepository<OrderItemEntity, Long> {

    // 根據訂單 ID 查詢商品明細
    List<OrderItemEntity> findByOrderId(Long orderId);
}