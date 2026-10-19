package com.phonecase.backend.order.service;

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
import java.util.stream.Collectors;

@Service
public class OrderQueryService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public OrderQueryService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // =====================================
    // 1. 回傳給 React 的訂單格式
    // =====================================

    public record OrderView(
            String id,
            String date,
            String productName,
            String model,
            Integer quantity,
            BigDecimal total,
            BigDecimal shippingFee,
            String status,
            String receiverName,
            String receiverPhone,
            String receiverAddress,
            String shippingMethod,
            String paymentMethod,
            String storeChain,
            String storeId,
            String storeName,
            String storeLocation
    ) {
    }

    // =====================================
    // 2. 查詢某位會員的全部訂單
    // =====================================

    @Transactional(readOnly = true)
    public List<OrderView> getOrders(Long memberId) {

        List<OrderEntity> orders =
                orderRepository.findByMemberIdOrderByCreatedAtDesc(
                        memberId
                );

        return orders.stream()
                .map(this::convertToOrderView)
                .toList();
    }

    // =====================================
    // 3. 將 MySQL 訂單轉成 React 格式
    // =====================================

    private OrderView convertToOrderView(OrderEntity order) {

        // 找出這筆訂單的商品明細
        List<OrderItemEntity> items =
                orderItemRepository.findByOrderId(order.getId());

        // 多商品訂單以完整商品摘要呈現，保留既有列表資料格式。
        String productName = items.stream()
                .map(OrderItemEntity::getProductName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining("、"));

        String model = items.stream()
                .map(OrderItemEntity::getModelName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .collect(Collectors.joining("、"));

        Integer quantity = items.stream()
                .map(OrderItemEntity::getQuantity)
                .filter(itemQuantity -> itemQuantity != null)
                .mapToInt(Integer::intValue)
                .sum();

        if (productName.isBlank()) {
            productName = "沒有商品資料";
        }

        // MySQL 的日期轉成 YYYY-MM-DD
        String date =
                order.getCreatedAt() == null
                        ? ""
                        : order.getCreatedAt()
                               .toLocalDate()
                               .toString();

        return new OrderView(
                order.getOrderNumber(),
                date,
                productName,
                model,
                quantity,
                order.getTotalAmount(),
                order.getShippingFee(),
                convertStatus(order.getOrderStatus()),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getReceiverAddress(),
                order.getShippingMethod(),
                order.getPaymentMethod(),
                order.getStoreChain(),
                order.getStoreCode(),
                order.getStoreName(),
                order.getStoreLocation()
        );
    }

    // =====================================
    // 4. 訂單狀態轉成中文
    // =====================================

    private String convertStatus(String status) {

        if (status == null) {
            return "待付款";
        }

        return switch (status) {
            case "PENDING_PAYMENT" -> "待付款";
            case "PENDING_SHIPMENT" -> "待出貨";
            case "SHIPPED" -> "已出貨";
            case "COMPLETED" -> "已完成";
            case "CANCELLED" -> "已取消";
            default -> status;
        };
    }

    // =====================================
    // 5. 取消訂單
    // =====================================

    @Transactional
    public void cancelOrder(
            String orderNumber,
            Long memberId
    ) {

        // 先根據訂單編號查詢
        OrderEntity order =
                orderRepository.findByOrderNumber(orderNumber)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "找不到訂單"
                                )
                        );

        // 只能取消自己的訂單
        if (!order.getMemberId().equals(memberId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "找不到訂單"
            );
        }

        // 只有待付款、待出貨能取消
        String status = order.getOrderStatus();

        if (!"PENDING_PAYMENT".equals(status)
                && !"PENDING_SHIPMENT".equals(status)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "這筆訂單目前無法取消"
            );
        }

        // 更新 MySQL 訂單狀態
        order.setOrderStatus("CANCELLED");

        orderRepository.save(order);
    }
}