package com.phonecase.backend.order.service;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.entity.OrderItemEntity;
import com.phonecase.backend.order.repository.OrderItemRepository;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            ProductVariantRepository productVariantRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productVariantRepository = productVariantRepository;
    }

    private record PricedOrderItem(
            String productName,
            String modelName,
            String color,
            String sku,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal lineTotal
    ) {
    }

    // =========================================
    // 建立訂單
    // =========================================

    @Transactional
    public OrderEntity createOrder(
            CreateOrderRequest request,
            Long memberId
    ) {

        if (memberId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入會員"
            );
        }

        if (request == null) {
            badRequest("訂單資料不可為空");
        }

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

        String shippingMethod = request.shippingMethod();
        if (!"HOME".equals(shippingMethod) &&
                !"CVS".equals(shippingMethod)) {
            badRequest("配送方式不正確");
        }

        String paymentMethod = request.paymentMethod();
        if (!"CREDIT_CARD".equals(paymentMethod) &&
                !"COD".equals(paymentMethod)) {
            badRequest("付款方式不正確");
        }

        if ("HOME".equals(shippingMethod)) {
            if (isBlank(request.receiverAddress())) {
                badRequest("請輸入宅配地址");
            }
            if (request.receiverAddress().length() > 250) {
                badRequest("宅配地址過長");
            }
        }

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

        List<CreateOrderRequest.OrderItemRequest> items = request.items();
        if (items == null || items.isEmpty()) {
            badRequest("訂單不能沒有商品");
        }
        if (items.size() > 50) {
            badRequest("單筆訂單商品種類不可超過 50 種");
        }

        // 只接受規格 ID 與數量；價格、庫存、名稱和上架狀態都以資料庫為準。
        BigDecimal itemSubtotal = BigDecimal.ZERO;
        Set<Long> seenVariantIds = new HashSet<>();
        List<PricedOrderItem> pricedItems = new ArrayList<>();

        for (CreateOrderRequest.OrderItemRequest item : items) {
            if (item == null || item.variantId() == null ||
                    item.variantId() < 1) {
                badRequest("商品規格 ID 不正確");
            }

            if (!seenVariantIds.add(item.variantId())) {
                badRequest("同一商品規格不可重複出現在訂單中");
            }

            if (item.quantity() == null ||
                    item.quantity() < 1 ||
                    item.quantity() > 99) {
                badRequest("商品數量必須介於 1 到 99");
            }

            ProductVariant variant = productVariantRepository
                    .findById(item.variantId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "找不到商品規格，ID：" + item.variantId()
                    ));

            Product product = variant.getProduct();
            if (product == null) {
                badRequest("商品資料不存在");
            }

            if (!"上架".equals(variant.getStatus()) ||
                    !"上架".equals(product.getStatus())) {
                badRequest("商品目前未上架：" + item.variantId());
            }

            if (variant.getStock() == null ||
                    variant.getStock() < item.quantity()) {
                badRequest("商品庫存不足：" + product.getName());
            }

            String productName = product.getName();
            String modelName = variant.getModel();
            String color = isBlank(variant.getColor())
                    ? null
                    : variant.getColor().trim();
            String sku = variant.getSku();

            if (isBlank(productName) || isBlank(modelName)) {
                badRequest("商品名稱或型號資料不完整");
            }
            if (productName.length() > 150 ||
                    modelName.length() > 100 ||
                    (color != null && color.length() > 50)) {
                badRequest("商品資料長度超過訂單明細欄位限制");
            }
            if (variant.getPrice() == null ||
                    variant.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                badRequest("商品價格資料不正確");
            }

            BigDecimal lineTotal = variant.getPrice().multiply(
                    BigDecimal.valueOf(item.quantity())
            );
            itemSubtotal = itemSubtotal.add(lineTotal);

            pricedItems.add(new PricedOrderItem(
                    productName.trim(),
                    modelName.trim(),
                    color,
                    sku,
                    variant.getPrice(),
                    item.quantity(),
                    lineTotal
            ));
        }

        BigDecimal shippingFee =
                "HOME".equals(shippingMethod)
                        ? new BigDecimal("80")
                        : new BigDecimal("60");
        BigDecimal totalAmount = itemSubtotal.add(shippingFee);

        OrderEntity order = new OrderEntity();
        String orderNumber = "ORD" +
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 24);

        order.setOrderNumber(orderNumber);
        order.setMemberId(memberId);
        order.setOrderStatus(
                "CREDIT_CARD".equals(paymentMethod)
                        ? "PENDING_PAYMENT"
                        : "PENDING_SHIPMENT"
        );
        order.setReceiverName(request.receiverName().trim());
        order.setReceiverPhone(request.receiverPhone().trim());
        order.setShippingMethod(shippingMethod);
        order.setPaymentMethod(paymentMethod);

        if ("HOME".equals(shippingMethod)) {
            order.setReceiverAddress(request.receiverAddress().trim());
        }

        if ("CVS".equals(shippingMethod)) {
            order.setStoreChain(request.storeChain());
            order.setStoreCode(request.storeCode().trim());
            order.setStoreName(request.storeName().trim());
            order.setStoreLocation(request.storeLocation().trim());
        }

        order.setItemSubtotal(itemSubtotal);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(totalAmount);

        OrderEntity savedOrder = orderRepository.saveAndFlush(order);

        for (PricedOrderItem pricedItem : pricedItems) {
            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setOrderId(savedOrder.getId());
            orderItem.setProductName(pricedItem.productName());
            orderItem.setModelName(pricedItem.modelName());
            orderItem.setColor(pricedItem.color());
            if (!isBlank(pricedItem.sku())) {
                orderItem.setVariantDescription("SKU: " + pricedItem.sku());
            }
            orderItem.setUnitPrice(pricedItem.unitPrice());
            orderItem.setQuantity(pricedItem.quantity());
            orderItem.setLineTotal(pricedItem.lineTotal());
            orderItemRepository.save(orderItem);
        }

        return savedOrder;
    }

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
