package com.phonecase.backend.order.repository;

import com.phonecase.backend.order.entity.OrderEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository
        extends JpaRepository<OrderEntity, Long> {

    // 根據訂單編號查詢
    Optional<OrderEntity> findByOrderNumber(String orderNumber);

    // 查詢某位會員的所有訂單
    List<OrderEntity> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}