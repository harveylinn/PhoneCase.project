package com.phonecase.backend.cart.dto;

import java.util.List;

// 會員登入後，前端送來的購物車合併請求
public record MergeCartRequest(

        // 同一批合併操作使用固定的唯一識別碼
        String mergeId,

        // 訪客準備合併到會員購物車的商品清單
        List<MergeCartItem> items

) {

    // 單筆商品只需要商品規格 ID 與數量
    public record MergeCartItem(
            Long variantId,
            Integer quantity
    ) {
    }
}