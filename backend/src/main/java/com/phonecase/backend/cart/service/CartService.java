package com.phonecase.backend.cart.service;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import com.phonecase.backend.cart.exception.CartItemNotFoundException;

import java.util.List;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final EntityManager entityManager;

    public CartService(
            CartItemRepository cartItemRepository,
            ProductVariantRepository productVariantRepository,
            EntityManager entityManager) {
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
        this.entityManager = entityManager;
    }

    // 加入購物車
    @Transactional
    public CartItem addItem(
            Long memberId,
            Long variantId,
            Integer quantity
    ){
        // Step 1：驗證基本參數
        if (memberId == null || variantId == null || quantity == null ||quantity <= 0){
            throw new IllegalArgumentException("購物車參數不正確");
        }

        // Step 2：確認商品規格存在
        ProductVariant variant = productVariantRepository
                                        .findById(variantId)
                                        .orElseThrow(()-> new IllegalArgumentException("商品規格不存在"));

        // Step 3：查詢購物車是否已有相同商品規格
        CartItem item = cartItemRepository
                        .findByMemberIdAndVariantId(memberId, variantId)
                        .orElseGet(()->{
                            CartItem newItem = new CartItem();
                            newItem.setMemberId(memberId);
                            newItem.setVariantId(variantId);
                            newItem.setQuantity(0);
                            return newItem;
                        });

        // Step 4：計算加入後數量
        int newQuantity = Math.addExact(item.getQuantity(), quantity);

        // Step 5：檢查商品庫存
        Integer stock = variant.getStock();

        if (stock == null || stock < 0 || newQuantity > stock){
            throw new IllegalArgumentException("商品庫存不足");
        }

        // Step 6：更新購物車數量
        item.setQuantity(newQuantity);

        // Step 7：儲存購物車
        CartItem savedItem = cartItemRepository.saveAndFlush(item);

        // Step 8：重新取得資料庫產生的時間
        entityManager.refresh(savedItem);

        // Step 9：回傳完整資料
        return savedItem;
    }

    // 查詢購物車
    @Transactional(readOnly = true)
    public List<CartItem> getCartItems(Long memberId) {

        if (memberId == null) {
            throw new IllegalArgumentException("會員 ID 不可為空");
        }

        return cartItemRepository.findByMemberId(memberId);
    }

    // 修改數量
    @Transactional
    public CartItem updateQuantity(
            Long memberId,
            Long cartItemId,
            Integer quantity
    ) {
        // Step 1：驗證參數
        if (memberId == null || cartItemId == null
                || quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("購物車參數不正確");
        }

        // Step 2：查詢購物車商品
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() ->
                        new CartItemNotFoundException("購物車商品不存在"));

        // Step 3：檢查商品是否屬於目前登入會員
        if (!memberId.equals(item.getMemberId())) {
            throw new CartItemNotFoundException("購物車商品不存在");
        }

        // Step 4：查詢商品規格
        ProductVariant variant = productVariantRepository
                .findById(item.getVariantId())
                .orElseThrow(() ->
                        new IllegalArgumentException("商品規格不存在"));

        // Step 5：檢查庫存
        Integer stock = variant.getStock();

        if (stock == null || stock < 0 || quantity > stock) {
            throw new IllegalArgumentException("商品庫存不足");
        }

        // Step 6：直接設定新數量
        item.setQuantity(quantity);

        // Step 7：儲存並回傳
        return cartItemRepository.save(item);
    }

    // 刪除購物車
    @Transactional
    public void removeItem(Long memberId, Long cartItemId) {

        // Step 1：驗證參數
        if (memberId == null || cartItemId == null) {
            throw new IllegalArgumentException("購物車參數不正確");
        }

        // Step 2：查詢購物車項目
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() ->
                        new CartItemNotFoundException("購物車商品不存在"));

        // Step 3：檢查會員所有權
        if (!memberId.equals(item.getMemberId())) {
            throw new CartItemNotFoundException("購物車商品不存在");
        }

        // Step 4：刪除購物車商品
        cartItemRepository.delete(item);
    }
}
