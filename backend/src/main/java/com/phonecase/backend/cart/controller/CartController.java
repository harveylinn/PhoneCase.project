package com.phonecase.backend.cart.controller;

import com.phonecase.backend.cart.service.CartService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.phonecase.backend.cart.dto.AddCartItemRequest;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/ping")
    public String ping() {
        return "Cart API OK";
    }

    @PostMapping("/test-body")
    public String testRequestBody(
            @RequestBody AddCartItemRequest request
    ) {
        return "收到 variantId = " + request.variantId()
                + ", quantity = " + request.quantity();
    }

    @PostMapping("/preview")
    public String previewAddItem(
            @RequestBody AddCartItemRequest request
    ) {
        Long variantId = request.variantId();
        Integer quantity = request.quantity();

        return "準備加入商品規格 " + variantId
                + "，數量 " + quantity;
    }
}
