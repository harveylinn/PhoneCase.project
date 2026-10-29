package com.phonecase.backend.dto;

import java.util.List;

public record CreateOrderRequest(

        // 收件人
        String receiverName,
        String receiverPhone,
        String receiverAddress,

        // 配送與付款
        String shippingMethod,
        String paymentMethod,

        // 綠界超商資料
        String storeChain,
        String storeCode,
        String storeName,
        String storeLocation,

        // 訂單商品
        List<OrderItemRequest> items

) {

    public record OrderItemRequest(
            Long variantId,
            Integer quantity
    ) {
    }

}
