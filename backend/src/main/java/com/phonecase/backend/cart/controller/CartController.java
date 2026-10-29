package com.phonecase.backend.cart.controller;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.cart.service.CartService;
import com.phonecase.backend.cart.dto.AddCartItemRequest;
import com.phonecase.backend.cart.dto.UpdateCartItemRequest;
import com.phonecase.backend.member.security.CheckJwt;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import jakarta.servlet.http.HttpServletRequest;

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

    @CheckJwt
    @GetMapping("/me")
    public String getCurrentMember(HttpServletRequest request) {

        Long memberId = (Long)request.getAttribute("authenticatedMemberId");

        return "目前登入會員 ID:" + memberId;
    }

    // 新增購物車商品
    @CheckJwt
    @PostMapping("/items")
    public CartItem addCartItem(
            @RequestBody AddCartItemRequest body,
            HttpServletRequest request
    ) {
        Long memberId = (Long) request.getAttribute("authenticatedMemberId");

        return cartService.addItem(
                memberId,
                body.variantId(),
                body.quantity()
        );
    }

    // 查詢購物車商品
    @CheckJwt
    @GetMapping("/items")
    public List<CartItem> getCartItems(HttpServletRequest request) {

        Long memberId = (Long) request.getAttribute("authenticatedMemberId");

        return cartService.getCartItems(memberId);
    }

    // 修改購物車商品
    @CheckJwt
    @PatchMapping("/items/{id}")
    public CartItem updateCartItem(
            @PathVariable("id") Long cartItemId,
            @RequestBody UpdateCartItemRequest body,
            HttpServletRequest request
    ) {
        Long memberId = (Long) request.getAttribute("authenticatedMemberId");

        return cartService.updateQuantity(
                memberId,
                cartItemId,
                body.quantity()
        );
    }

    // 刪除購物車商品
    @CheckJwt
    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCartItem(
            @PathVariable("id") Long cartItemId,
            HttpServletRequest request
    ) {
        Long memberId = (Long) request.getAttribute("authenticatedMemberId");

        cartService.removeItem(memberId, cartItemId);
    }

}
