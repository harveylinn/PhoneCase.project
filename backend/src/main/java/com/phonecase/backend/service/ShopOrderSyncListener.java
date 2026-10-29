package com.phonecase.backend.service;

import com.phonecase.backend.order.entity.OrderEntity;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

// 掛在 OrderEntity 上的 JPA 監聽器：商城訂單寫入資料庫時發出事件
// 不必修改下單、付款回傳、取消訂單等各處程式；實際同步在交易提交後執行（見 ShopSyncService.onShopOrderChanged）
@Component
public class ShopOrderSyncListener {

    private final ApplicationEventPublisher eventPublisher;

    public ShopOrderSyncListener(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @PostPersist
    @PostUpdate
    @PostRemove
    public void onOrderChanged(OrderEntity order) {
        eventPublisher.publishEvent(new ShopOrderChangedEvent(order.getId()));
    }
}
