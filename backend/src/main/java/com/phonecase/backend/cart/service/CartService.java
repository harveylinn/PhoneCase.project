package com.phonecase.backend.cart.service;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            ProductVariantRepository productVariantRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
    }

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
        return cartItemRepository.save(item);
    }

}
