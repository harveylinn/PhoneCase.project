package com.phonecase.backend.cart.dto;

public record AddCartItemRequest(
        Long variantId,
        Integer quantity
) {

}
