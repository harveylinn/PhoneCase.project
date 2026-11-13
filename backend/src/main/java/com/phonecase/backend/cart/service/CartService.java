package com.phonecase.backend.cart.service;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import com.phonecase.backend.cart.exception.CartItemNotFoundException;
import com.phonecase.backend.cart.dto.MergeCartRequest;
import com.phonecase.backend.cart.entity.CartMergeRecord;
import com.phonecase.backend.cart.repository.CartMergeRecordRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;
import java.util.List;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final EntityManager entityManager;
    // 儲存已完成的購物車合併紀錄
    private final CartMergeRecordRepository cartMergeRecordRepository;

    public CartService(
            CartItemRepository cartItemRepository,
            ProductVariantRepository productVariantRepository,
            EntityManager entityManager,
            CartMergeRecordRepository cartMergeRecordRepository) {
        this.cartItemRepository = cartItemRepository;
        this.productVariantRepository = productVariantRepository;
        this.entityManager = entityManager;
        this.cartMergeRecordRepository = cartMergeRecordRepository;
    }

    // 會員購物車共用資料庫鎖
    private void lockMemberCart(Long memberId) {

        // 1. 確認會員 ID 合法
        if (memberId == null || memberId <= 0) {
            throw new IllegalArgumentException("會員 ID 不正確");
        }

        // 2. 確保每個會員都有一筆鎖定紀錄
        //    若紀錄已存在，則不會新增第二筆
        entityManager.createNativeQuery(
                        "INSERT INTO cart_merge_member_locks (member_id) " +
                                "VALUES (:memberId) " +
                                "ON DUPLICATE KEY UPDATE member_id = member_id"
                )
                .setParameter("memberId", memberId)
                .executeUpdate();

        // 3. 使用 MySQL FOR UPDATE 取得交易鎖
        //    同一會員的其他寫入操作需要等待鎖釋放
        entityManager.createNativeQuery(
                        "SELECT member_id FROM cart_merge_member_locks " +
                                "WHERE member_id = :memberId FOR UPDATE"
                )
                .setParameter("memberId", memberId)
                .getSingleResult();
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

        // 先鎖定會員購物車，再讀取與修改數量
        lockMemberCart(memberId);

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

        // 修改數量前先取得會員購物車交易鎖
        lockMemberCart(memberId);

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

        // 刪除商品前先取得會員購物車交易鎖
        lockMemberCart(memberId);

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

    //訪客購物車合併會員購物車
    @Transactional
    public List<CartItem> mergeGuestCart(
            Long memberId,
            MergeCartRequest request
    ) {
        // 驗證會員與請求
        if (memberId == null || request == null
                || request.mergeId() == null
                || request.items() == null
                || request.items().isEmpty()
                || request.items().size() > 100) {
            throw new IllegalArgumentException("合併請求不正確");
        }

        // mergeId 必須為 UUID 格式
        try {
            UUID.fromString(request.mergeId());
        } catch (IllegalArgumentException error) {
            throw new IllegalArgumentException("合併識別碼不正確");
        }

        // 驗證商品內容，防止同一規格重複出現
        Set<Long> variantIds = new HashSet<>();

        for (MergeCartRequest.MergeCartItem item : request.items()) {
            if (item == null
                    || item.variantId() == null
                    || item.variantId() <= 0
                    || item.quantity() == null
                    || item.quantity() <= 0
                    || !variantIds.add(item.variantId())) {
                throw new IllegalArgumentException("合併商品資料不正確");
            }
        }

        // 4. 將商品依 variantId 排序，產生固定的請求指紋
        //    即使前端改變商品排列順序，也能得到相同雜湊
        List<MergeCartRequest.MergeCartItem> sortedItems =
                new ArrayList<>(request.items());

        sortedItems.sort(
                Comparator.comparing(
                        MergeCartRequest.MergeCartItem::variantId
                )
        );

        StringBuilder content = new StringBuilder();

        for (MergeCartRequest.MergeCartItem item : sortedItems) {
            content.append(item.variantId())
                    .append(":")
                    .append(item.quantity())
                    .append(";");
        }

        String requestHash;

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    content.toString().getBytes(StandardCharsets.UTF_8)
            );
            requestHash = HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("無法計算合併請求指紋", error);
        }

        // 取得會員購物車共用交易鎖
        lockMemberCart(memberId);

        // 檢查這次 mergeId 是否已經執行
        var existingRecord =
                cartMergeRecordRepository.findByMergeId(request.mergeId());

        if (existingRecord.isPresent()) {
            CartMergeRecord record = existingRecord.get();

            // 同一 mergeId 不能給其他會員使用
            if (!memberId.equals(record.getMemberId())) {
                throw new IllegalArgumentException("合併識別碼已被使用");
            }

            // 同一 mergeId 不能搭配不同商品清單
            if (!requestHash.equals(record.getRequestHash())) {
                throw new IllegalArgumentException("合併請求內容不一致");
            }

            // 已經成功合併，直接返回目前的會員購物車
            // 不再次增加商品數量
            return getCartItems(memberId);
        }

        // 執行整批商品合併
        //    沿用現有 addItem() 的商品規格與庫存檢查
        for (MergeCartRequest.MergeCartItem item : sortedItems) {
            addItem(memberId, item.variantId(), item.quantity());
        }

        // 所有商品成功後，記錄這次合併
        CartMergeRecord record = new CartMergeRecord();
        record.setMergeId(request.mergeId());
        record.setMemberId(memberId);
        record.setRequestHash(requestHash);

        cartMergeRecordRepository.saveAndFlush(record);

        // 回傳合併後的會員購物車
        return getCartItems(memberId);
    }
}
