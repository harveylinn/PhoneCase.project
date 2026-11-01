package com.phonecase.backend.service;

// 商城訂單新增、修改（付款、取消等狀態變更）或刪除，交易提交後由 ShopSyncService 立即同步到後台訂單
public record ShopOrderChangedEvent(Long orderId) {
}
