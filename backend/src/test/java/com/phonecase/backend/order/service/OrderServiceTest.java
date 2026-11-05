package com.phonecase.backend.order.service;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.entity.OrderItemEntity;
import com.phonecase.backend.order.repository.OrderItemRepository;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;

class OrderServiceTest {

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderItemRepository orderItemRepository =
            mock(OrderItemRepository.class);
    private final ProductVariantRepository productVariantRepository =
            mock(ProductVariantRepository.class);
    private final CartItemRepository cartItemRepository =
            mock(CartItemRepository.class);
    private final EntityManager entityManager = mock(EntityManager.class);

    private OrderService orderService;
    private CartItem selectedCartItem;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository,
                orderItemRepository,
                productVariantRepository,
                cartItemRepository,
                entityManager
        );

        Query insertLock = mock(Query.class);
        Query selectLock = mock(Query.class);
        when(entityManager.createNativeQuery(startsWith("INSERT INTO cart_merge_member_locks")))
                .thenReturn(insertLock);
        when(entityManager.createNativeQuery(startsWith("SELECT member_id FROM cart_merge_member_locks")))
                .thenReturn(selectLock);
        when(insertLock.setParameter("memberId", 7L)).thenReturn(insertLock);
        when(selectLock.setParameter("memberId", 7L)).thenReturn(selectLock);
        when(selectLock.getSingleResult()).thenReturn(7L);

        selectedCartItem = cartItem(7L, 3L, 2);
        when(cartItemRepository.findByMemberIdAndVariantId(7L, 3L))
                .thenReturn(Optional.of(selectedCartItem));

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
        assertEquals(7L, order.getMemberId());

        var operations = inOrder(entityManager, cartItemRepository,
                orderRepository, orderItemRepository);
        operations.verify(entityManager).createNativeQuery(
                startsWith("INSERT INTO cart_merge_member_locks"));
        operations.verify(entityManager).createNativeQuery(
                startsWith("SELECT member_id FROM cart_merge_member_locks"));
        operations.verify(cartItemRepository).findByMemberIdAndVariantId(7L, 3L);
        operations.verify(orderRepository).saveAndFlush(any(OrderEntity.class));
        operations.verify(orderItemRepository).save(any(OrderItemEntity.class));
        operations.verify(cartItemRepository).deleteAll(List.of(selectedCartItem));
        operations.verify(cartItemRepository).flush();
    }

    @Test
    void rejectsQuantityAboveCurrentStockBeforeSavingOrder() {
        selectedCartItem.setQuantity(4);
        assertThrows(
                ResponseStatusException.class,
                () -> orderService.createOrder(request(4), 7L)
        );

        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
        verify(orderItemRepository, never()).save(any(OrderItemEntity.class));
        verify(cartItemRepository, never()).deleteAll(any(Iterable.class));
    }

    @Test
    void rejectsItemMissingFromTheAuthenticatedMembersCart() {
        // 其他會員擁有同規格，也不能讓目前會員結帳。
        when(cartItemRepository.findByMemberIdAndVariantId(7L, 3L))
                .thenReturn(Optional.empty());
        when(cartItemRepository.findByMemberIdAndVariantId(8L, 3L))
                .thenReturn(Optional.of(cartItem(8L, 3L, 2)));

        var error = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(request(2), 7L));

        assertEquals(409, error.getStatusCode().value());
        verify(cartItemRepository, never()).findByMemberIdAndVariantId(8L, 3L);
        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
        verify(cartItemRepository, never()).deleteAll(any(Iterable.class));
    }

    @Test
    void rejectsCartQuantityChangedAfterCheckoutSelection() {
        selectedCartItem.setQuantity(3);

        var error = assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(request(2), 7L));

        assertEquals(409, error.getStatusCode().value());
        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
        verify(cartItemRepository, never()).deleteAll(any(Iterable.class));
    }

    @Test
    void rejectsInvalidQuantitiesBeforeLookingUpCartItems() {
        for (int invalid : new int[] {-1, 0, 100}) {
            var error = assertThrows(ResponseStatusException.class,
                    () -> orderService.createOrder(request(invalid), 7L));
            assertEquals(400, error.getStatusCode().value());
        }
        assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(request(null), 7L));
        verify(cartItemRepository, never()).findByMemberIdAndVariantId(7L, 3L);
        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
        verify(cartItemRepository, never()).deleteAll(any(Iterable.class));
    }

    @Test
    void removesOnlyPurchasedItemsAndDoesNotQueryUnselectedVariants() {
        CartItem unselected = cartItem(7L, 4L, 1);
        when(cartItemRepository.findByMemberIdAndVariantId(7L, 4L))
                .thenReturn(Optional.of(unselected));

        orderService.createOrder(request(2), 7L);

        var removed = org.mockito.ArgumentCaptor.forClass(Iterable.class);
        verify(cartItemRepository).deleteAll(removed.capture());
        assertEquals(List.of(selectedCartItem), removed.getValue());
        verify(cartItemRepository, never()).findByMemberIdAndVariantId(7L, 4L);
        verify(cartItemRepository, never()).delete(unselected);
    }

    @Test
    void doesNotRemoveCartItemsWhenSavingOrderItemsFails() {
        doThrow(new IllegalStateException("明細寫入失敗"))
                .when(orderItemRepository).save(any(OrderItemEntity.class));

        assertThrows(IllegalStateException.class,
                () -> orderService.createOrder(request(2), 7L));

        verify(cartItemRepository, never()).deleteAll(any(Iterable.class));
    }

    @Test
    void rejectsUnauthenticatedCheckoutBeforeAccessingCart() {
        assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(request(2), null));
        assertThrows(ResponseStatusException.class,
                () -> orderService.createOrder(request(2), 0L));

        verify(entityManager, never()).createNativeQuery(anyString());
        verify(orderRepository, never()).saveAndFlush(any(OrderEntity.class));
    }

    private CartItem cartItem(Long memberId, Long variantId, int quantity) {
        CartItem item = new CartItem();
        item.setMemberId(memberId);
        item.setVariantId(variantId);
        item.setQuantity(quantity);
        return item;
    }

    private CreateOrderRequest request(Integer quantity) {
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
