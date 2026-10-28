package com.phonecase.backend.order.service;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.entity.OrderItemEntity;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.order.repository.OrderItemRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // =========================================
    // 建立訂單
    // =========================================

    @Transactional
    public OrderEntity createOrder(
            CreateOrderRequest request,
            Long memberId
    ) {

        // 1. 確認會員身分
        if (memberId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入會員"
            );
        }

        if (request == null) {
            badRequest("訂單資料不可為空");
        }

        // 2. 檢查收件人資料
        if (isBlank(request.receiverName())) {
            badRequest("請輸入收件人姓名");
        }

        if (isBlank(request.receiverPhone())) {
            badRequest("請輸入聯絡電話");
        }

        if (request.receiverName().length() > 100 ||
                request.receiverPhone().length() > 30) {
            badRequest("收件人資料長度超過限制");
        }

        // 3. 檢查配送方式
        String shippingMethod = request.shippingMethod();

        if (!"HOME".equals(shippingMethod) &&
                !"CVS".equals(shippingMethod)) {
            badRequest("配送方式不正確");
        }

        // 4. 檢查付款方式
        String paymentMethod = request.paymentMethod();

        if (!"CREDIT_CARD".equals(paymentMethod) &&
                !"COD".equals(paymentMethod)) {
            badRequest("付款方式不正確");
        }

        // 5. 檢查宅配地址
        if ("HOME".equals(shippingMethod)) {

            if (isBlank(request.receiverAddress())) {
                badRequest("請輸入宅配地址");
            }

            if (request.receiverAddress().length() > 250) {
                badRequest("宅配地址過長");
            }
        }

        // 6. 檢查超商門市
        if ("CVS".equals(shippingMethod)) {

            if (!"UNIMART".equals(request.storeChain()) &&
                    !"FAMI".equals(request.storeChain())) {
                badRequest("超商品牌不正確");
            }

            if (isBlank(request.storeCode()) ||
                    isBlank(request.storeName()) ||
                    isBlank(request.storeLocation())) {
                badRequest("請先選擇超商門市");
            }

            if (request.storeCode().length() > 50 ||
                    request.storeName().length() > 100 ||
                    request.storeLocation().length() > 200) {
                badRequest("超商門市資料過長");
            }
        }

        // 7. 檢查商品資料
        List<CreateOrderRequest.OrderItemRequest> items =
                request.items();

        if (items == null || items.isEmpty()) {
            badRequest("訂單不能沒有商品");
        }

        if (items.size() > 50) {
            badRequest("單筆訂單商品種類不可超過 50 種");
        }

        // =========================================
        // 8. 計算商品小計
        // =========================================

        BigDecimal itemSubtotal = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderItemRequest item : items) {

            if (item == null ||
                    isBlank(item.productName()) ||
                    isBlank(item.modelName())) {
                badRequest("商品資料不完整");
            }

            if (item.quantity() == null ||
                    item.quantity() < 1 ||
                    item.quantity() > 99) {
                badRequest("商品數量必須介於 1 到 99");
            }

            // 目前只支援結帳頁面的測試商品
            BigDecimal unitPrice = getTestProductPrice(item);

            BigDecimal lineTotal = unitPrice.multiply(
                    BigDecimal.valueOf(item.quantity())
            );

            itemSubtotal = itemSubtotal.add(lineTotal);
        }

        // =========================================
        // 9. 計算運費與總金額
        // =========================================

        BigDecimal shippingFee =
                "HOME".equals(shippingMethod)
                        ? new BigDecimal("80")
                        : new BigDecimal("60");

        BigDecimal totalAmount =
                itemSubtotal.add(shippingFee);

        // =========================================
        // 10. 建立 order 資料
        // =========================================

        OrderEntity order = new OrderEntity();

        // 後端產生唯一訂單編號
        String orderNumber = "ORD" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 24);

        order.setOrderNumber(orderNumber);

        order.setMemberId(memberId);

        // 信用卡尚未完成付款，所以是待付款
        // 貨到付款則是待出貨
        if ("CREDIT_CARD".equals(paymentMethod)) {
            order.setOrderStatus("PENDING_PAYMENT");
        } else {
            order.setOrderStatus("PENDING_SHIPMENT");
        }

        order.setReceiverName(request.receiverName().trim());
        order.setReceiverPhone(request.receiverPhone().trim());

        order.setShippingMethod(shippingMethod);
        order.setPaymentMethod(paymentMethod);

        // 宅配資料
        if ("HOME".equals(shippingMethod)) {
            order.setReceiverAddress(
                    request.receiverAddress().trim()
            );
        }

        // 超商資料
        if ("CVS".equals(shippingMethod)) {

            order.setStoreChain(request.storeChain());
            order.setStoreCode(request.storeCode().trim());
            order.setStoreName(request.storeName().trim());
            order.setStoreLocation(
                    request.storeLocation().trim()
            );
        }

        order.setItemSubtotal(itemSubtotal);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(totalAmount);

        // =========================================
        // 11. 儲存到 MySQL 的 order 表
        // =========================================

        OrderEntity savedOrder =
                orderRepository.saveAndFlush(order);

        // =========================================
        // 12. 儲存到 MySQL 的 order_item 表
        // =========================================

        for (CreateOrderRequest.OrderItemRequest item : items) {

            BigDecimal unitPrice = getTestProductPrice(item);

            BigDecimal lineTotal = unitPrice.multiply(
                    BigDecimal.valueOf(item.quantity())
            );

            OrderItemEntity orderItem = new OrderItemEntity();

            orderItem.setOrderId(savedOrder.getId());
            orderItem.setProductName(item.productName().trim());
            orderItem.setModelName(item.modelName().trim());

            if (!isBlank(item.color())) {
                orderItem.setColor(item.color().trim());
            }

            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(item.quantity());
            orderItem.setLineTotal(lineTotal);

            orderItemRepository.save(orderItem);
        }

        return savedOrder;
    }

    // =========================================
    // 測試商品價格
    // =========================================

    private BigDecimal getTestProductPrice(
            CreateOrderRequest.OrderItemRequest item
    ) {

        if ("透明防摔手機殼".equals(item.productName()) &&
                "iPhone 17 Pro".equals(item.modelName())) {

            return new BigDecimal("590");
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "目前只支援測試商品：透明防摔手機殼 iPhone 17 Pro"
        );
    }

    // =========================================
    // 工具方法
    // =========================================

    private boolean isBlank(String text) {
        return text == null || text.isBlank();
    }

    private void badRequest(String message) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message
        );
    }

}