package com.phonecase.backend.order.service;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.entity.OrderItemEntity;
import com.phonecase.backend.order.repository.OrderItemRepository;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServiceTest {

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderItemRepository orderItemRepository =
            mock(OrderItemRepository.class);
    private final ProductVariantRepository productVariantRepository =
            mock(ProductVariantRepository.class);

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                productVariantRepository
        );

        Product product = new Product();
        product.setName("透明防摔手機殼");
        product.setStatus("上架");

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setModel("iPhone 17 Pro");
        variant.setColor("透明");
        variant.setPrice(new BigDecimal("590.00"));
        variant.setStock(3);
        variant.setSku("CASE-IP17P-CLEAR");
        variant.setStatus("上架");

        when(productVariantRepository.findById(3L))
                .thenReturn(Optional.of(variant));

        when(orderRepository.saveAndFlush(any(OrderEntity.class)))
                .thenAnswer(invocation -> {
                    OrderEntity order = invocation.getArgument(0);
                    ReflectionTestUtils.setField(order, "id", 101L);
                    return order;
                });
    }

    @Test
    void createsOrderUsingDatabasePriceAndProductSnapshot() {
        OrderEntity order = orderService.createOrder(request(2), 7L);

        assertEquals(new BigDecimal("1180.00"), order.getItemSubtotal());
        assertEquals(new BigDecimal("80"), order.getShippingFee());
        assertEquals(new BigDecimal("1260.00"), order.getTotalAmount());

        var itemCaptor =
                org.mockito.ArgumentCaptor.forClass(OrderItemEntity.class);
        verify(orderItemRepository).save(itemCaptor.capture());

        OrderItemEntity savedItem = itemCaptor.getValue();
        assertEquals(101L, savedItem.getOrderId());
        assertEquals("透明防摔手機殼", savedItem.getProductName());
        assertEquals("iPhone 17 Pro", savedItem.getModelName());
        assertEquals("透明", savedItem.getColor());
        assertEquals("SKU: CASE-IP17P-CLEAR",
                savedItem.getVariantDescription());
        assertEquals(new BigDecimal("590.00"), savedItem.getUnitPrice());
        assertEquals(2, savedItem.getQuantity());
        assertEquals(new BigDecimal("1180.00"), savedItem.getLineTotal());
    }

    @Test
    void rejectsQuantityAboveCurrentStockBeforeSavingOrder() {
        assertThrows(
                ResponseStatusException.class,
                () -> orderService.createOrder(request(4), 7L)
        );

        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
        verify(orderItemRepository, never()).save(any(OrderItemEntity.class));
    }

    private CreateOrderRequest request(int quantity) {
        return new CreateOrderRequest(
                "測試收件人",
                "0912345678",
                "台北市測試地址",
                "HOME",
                "COD",
                null,
                null,
                null,
                null,
                List.of(new CreateOrderRequest.OrderItemRequest(3L, quantity))
        );
    }
}
