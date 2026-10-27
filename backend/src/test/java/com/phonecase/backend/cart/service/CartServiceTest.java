
package com.phonecase.backend.cart.service;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductVariantRepository;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CartServiceTest {

    @Test
    void shouldAddNewItemToCart() {

        // Step 1：建立假的 Repository
        CartItemRepository cartItemRepository =
                mock(CartItemRepository.class);

        ProductVariantRepository productVariantRepository =
                mock(ProductVariantRepository.class);

        // Step 2：建立真正的 CartService
        CartService cartService = new CartService(
                cartItemRepository,
                productVariantRepository
        );

        // Step 3：準備假的商品規格
        ProductVariant variant = new ProductVariant();
        variant.setStock(10);

        // Step 4：設定 Mockito 的回傳資料
        when(productVariantRepository.findById(101L))
                .thenReturn(Optional.of(variant));

        when(cartItemRepository.findByMemberIdAndVariantId(1L, 101L))
                .thenReturn(Optional.empty());

        when(cartItemRepository.save(any(CartItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Step 5：真正執行 CartService.addItem()
        CartItem result = cartService.addItem(1L, 101L, 2);

        // Step 6：檢查結果
        assertEquals(1L, result.getMemberId());
        assertEquals(101L, result.getVariantId());
        assertEquals(2, result.getQuantity());

        // Step 7：確認有呼叫 save()
        verify(cartItemRepository).save(any(CartItem.class));
    }


    @Test
    void shouldIncreaseExistingCartItemQuantity() {

        // Step 1：建立 Mock Repository
        CartItemRepository cartItemRepository =
                mock(CartItemRepository.class);

        ProductVariantRepository productVariantRepository =
                mock(ProductVariantRepository.class);

        // Step 2：建立真正的 CartService
        CartService cartService = new CartService(
                cartItemRepository,
                productVariantRepository
        );

        // Step 3：準備商品規格，庫存為 10
        ProductVariant variant = new ProductVariant();
        variant.setStock(10);

        // Step 4：準備原本購物車中的商品
        CartItem existingItem = new CartItem();
        existingItem.setMemberId(1L);
        existingItem.setVariantId(101L);
        existingItem.setQuantity(3);

        // Step 5：設定 Mockito 的回傳資料
        when(productVariantRepository.findById(101L))
                .thenReturn(Optional.of(variant));

        when(cartItemRepository.findByMemberIdAndVariantId(1L, 101L))
                .thenReturn(Optional.of(existingItem));

        when(cartItemRepository.save(any(CartItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Step 6：再加入 2 件
        CartItem result = cartService.addItem(1L, 101L, 2);

        // Step 7：確認數量變成 5
        assertEquals(5, result.getQuantity());

        // Step 8：確認 save() 被呼叫一次
        verify(cartItemRepository).save(any(CartItem.class));
    }


    @Test
    void shouldRejectWhenStockIsInsufficient() {

        // Step 1：建立 Mock Repository
        CartItemRepository cartItemRepository =
                mock(CartItemRepository.class);

        ProductVariantRepository productVariantRepository =
                mock(ProductVariantRepository.class);

        // Step 2：建立 CartService
        CartService cartService = new CartService(
                cartItemRepository,
                productVariantRepository
        );

        // Step 3：設定商品庫存只有 4 件
        ProductVariant variant = new ProductVariant();
        variant.setStock(4);

        // Step 4：購物車原本有 3 件
        CartItem existingItem = new CartItem();
        existingItem.setMemberId(1L);
        existingItem.setVariantId(101L);
        existingItem.setQuantity(3);

        // Step 5：設定 Mockito 回傳資料
        when(productVariantRepository.findById(101L))
                .thenReturn(Optional.of(variant));

        when(cartItemRepository.findByMemberIdAndVariantId(1L, 101L))
                .thenReturn(Optional.of(existingItem));

        // Step 6：驗證加入 2 件時會拋出例外
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> cartService.addItem(1L, 101L, 2)
        );

        // Step 7：確認錯誤訊息
        assertEquals("商品庫存不足", exception.getMessage());

        // Step 8：確認沒有儲存購物車
        verify(cartItemRepository, never())
                .save(any(CartItem.class));
    }


    @Test
    void shouldRejectWhenProductVariantDoesNotExist() {

        // Step 1：建立假的 Repository
        CartItemRepository cartItemRepository =
                mock(CartItemRepository.class);

        ProductVariantRepository productVariantRepository =
                mock(ProductVariantRepository.class);

        // Step 2：建立真正的 CartService
        CartService cartService = new CartService(
                cartItemRepository,
                productVariantRepository
        );

        // Step 3：模擬商品規格不存在
        when(productVariantRepository.findById(101L))
                .thenReturn(Optional.empty());

        // Step 4：驗證 Service 拋出例外
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> cartService.addItem(1L, 101L, 2)
        );

        // Step 5：檢查錯誤訊息
        assertEquals("商品規格不存在", exception.getMessage());

        // Step 6：確認不會儲存購物車
        verify(cartItemRepository, never())
                .save(any(CartItem.class));
    }



}

