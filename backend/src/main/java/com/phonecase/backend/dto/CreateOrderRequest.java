package com.phonecase.backend.dto;

public record CreateOrderRequest(
    String receiverName,
    String receiverPhone,
    String receiverAddress,
    String shippingMethod,
    String paymentMethod
) {
}