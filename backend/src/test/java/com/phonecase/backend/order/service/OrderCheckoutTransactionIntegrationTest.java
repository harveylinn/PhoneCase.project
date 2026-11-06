package com.phonecase.backend.order.service;

import com.phonecase.backend.cart.entity.CartItem;
import com.phonecase.backend.cart.repository.CartItemRepository;
import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.repository.OrderItemRepository;
import com.phonecase.backend.order.repository.OrderRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.SharedEntityManagerCreator;
import org.springframework.orm.jpa.hibernate.SpringBeanContainer;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** Only uses an in-memory database; add H2 to the isolated test classpath to run. */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class OrderCheckoutTransactionIntegrationTest {

    private LocalContainerEntityManagerFactoryBean entityManagerFactory;
    private JdbcTemplate jdbc;
    private OrderService orderService;
    private OrderRepository orderRepository;
    private OrderItemRepository orderItemRepository;
    private CartItemRepository cartItemRepository;

    @BeforeAll
    void configureInMemoryDatabase() throws Exception {
        boolean h2Available;
        try {
            Class.forName("org.h2.Driver");
            h2Available = true;
        } catch (ClassNotFoundException unavailable) {
            h2Available = false;
        }
        assumeTrue(h2Available, "此隔離交易測試需在測試 classpath 提供 H2，不會連接 MySQL");

        var dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:order-checkout-" + UUID.randomUUID() +
                        ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        try (var connection = dataSource.getConnection()) {
            assertTrue(connection.getMetaData().getURL().startsWith("jdbc:h2:mem:"));
        }
        jdbc = new JdbcTemplate(dataSource);

        var beanFactory = new DefaultListableBeanFactory();
        beanFactory.registerResolvableDependency(ApplicationEventPublisher.class,
                (ApplicationEventPublisher) event -> { });
        entityManagerFactory = new LocalContainerEntityManagerFactoryBean();
        entityManagerFactory.setDataSource(dataSource);
        entityManagerFactory.setPackagesToScan(
                OrderEntity.class.getPackageName(), CartItem.class.getPackageName());
        entityManagerFactory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
        entityManagerFactory.setJpaPropertyMap(Map.of(
                "hibernate.hbm2ddl.auto", "create-drop",
                "hibernate.resource.beans.container", new SpringBeanContainer(beanFactory)));
        entityManagerFactory.afterPropertiesSet();
        var factory = entityManagerFactory.getObject();
        assertNotNull(factory);
        EntityManager entityManager = SharedEntityManagerCreator.createSharedEntityManager(factory);
        var repositories = new JpaRepositoryFactory(entityManager);
        orderRepository = repositories.getRepository(OrderRepository.class);
        orderItemRepository = repositories.getRepository(OrderItemRepository.class);
        cartItemRepository = repositories.getRepository(CartItemRepository.class);

        var product = new Product();
        product.setName("測試手機殼");
        product.setStatus("上架");
        var variant = new ProductVariant();
        variant.setProduct(product);
        variant.setModel("Pixel 8");
        variant.setColor("黑色");
        variant.setSku("CHECKOUT-PIXEL8");
        variant.setStatus("上架");
        variant.setStock(10);
        variant.setPrice(new BigDecimal("590.00"));
        var variantRepository = mock(ProductVariantRepository.class);
        when(variantRepository.findById(3L)).thenReturn(Optional.of(variant));

        var service = new OrderService(orderRepository, orderItemRepository,
                variantRepository, cartItemRepository, entityManager);
        var transactionAdvice = new TransactionInterceptor(
                new JpaTransactionManager(factory), new AnnotationTransactionAttributeSource());
        var proxy = new ProxyFactory(service);
        proxy.addAdvice(transactionAdvice);
        orderService = (OrderService) proxy.getProxy();
        jdbc.execute("CREATE TABLE cart_merge_member_locks (member_id bigint PRIMARY KEY)");
    }

    @BeforeEach
    void prepareCart() {
        jdbc.execute("DROP TABLE IF EXISTS checkout_cart_guard");
        jdbc.execute("ALTER TABLE order_item DROP CONSTRAINT IF EXISTS checkout_fail_items");
        jdbc.update("DELETE FROM order_item");
        jdbc.update("DELETE FROM \"order\"");
        jdbc.update("DELETE FROM cart_items");
        jdbc.update("DELETE FROM cart_merge_member_locks");
        jdbc.update("INSERT INTO cart_items (member_id, variant_id, quantity) VALUES (7, 3, 2)");
        jdbc.update("INSERT INTO cart_items (member_id, variant_id, quantity) VALUES (7, 4, 1)");
        jdbc.update("INSERT INTO cart_items (member_id, variant_id, quantity) VALUES (8, 3, 2)");
    }

    @AfterAll
    void closeDatabase() {
        if (entityManagerFactory != null) entityManagerFactory.destroy();
    }

    @Test
    void commitsOrderAndRemovesOnlySelectedItemsOfTheAuthenticatedMember() {
        var order = orderService.createOrder(request(), 7L);

        assertEquals(1, orderRepository.count());
        assertEquals(7L, orderRepository.findById(order.getId()).orElseThrow().getMemberId());
        assertEquals(new BigDecimal("1260.00"), order.getTotalAmount());
        var details = orderItemRepository.findByOrderId(order.getId());
        assertEquals(1, details.size());
        assertEquals("測試手機殼", details.getFirst().getProductName());
        assertEquals(2, details.getFirst().getQuantity());
        assertTrue(cartItemRepository.findByMemberIdAndVariantId(7L, 3L).isEmpty());
        assertEquals(1, cartItemRepository.findByMemberIdAndVariantId(7L, 4L)
                .orElseThrow().getQuantity());
        assertEquals(2, cartItemRepository.findByMemberIdAndVariantId(8L, 3L)
                .orElseThrow().getQuantity());
    }

    @Test
    void rollsBackOrderAndLeavesCartWhenOrderItemInsertFails() {
        jdbc.execute("ALTER TABLE order_item ADD CONSTRAINT checkout_fail_items CHECK (quantity < 0)");

        assertThrows(RuntimeException.class, () -> orderService.createOrder(request(), 7L));

        assertNoOrderAndUnchangedCart();
    }

    @Test
    void rollsBackOrderAndDetailsWhenPurchasedCartItemCannotBeRemoved() {
        jdbc.execute("CREATE TABLE checkout_cart_guard (cart_item_id bigint PRIMARY KEY, " +
                "FOREIGN KEY (cart_item_id) REFERENCES cart_items(id))");
        jdbc.update("INSERT INTO checkout_cart_guard SELECT id FROM cart_items " +
                "WHERE member_id = 7 AND variant_id = 3");

        assertThrows(RuntimeException.class, () -> orderService.createOrder(request(), 7L));

        assertNoOrderAndUnchangedCart();
    }

    @Test
    void serializesConcurrentCheckoutsForTheSameMemberCart() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var first = executor.submit(() -> attemptCheckout(start));
            var second = executor.submit(() -> attemptCheckout(start));
            start.countDown();
            var results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));

            assertEquals(1L, results.stream().filter(status -> status == 200).count());
            assertEquals(1L, results.stream().filter(status -> status == 409).count());
            assertEquals(1, orderRepository.count());
            assertEquals(1, orderItemRepository.count());
            assertTrue(cartItemRepository.findByMemberIdAndVariantId(7L, 4L).isPresent());
        }
    }

    private int attemptCheckout(CountDownLatch start) throws InterruptedException {
        start.await();
        try {
            orderService.createOrder(request(), 7L);
            return 200;
        } catch (ResponseStatusException failure) {
            return failure.getStatusCode().value();
        }
    }

    private void assertNoOrderAndUnchangedCart() {
        assertEquals(0, orderRepository.count());
        assertEquals(0, orderItemRepository.count());
        assertEquals(2, cartItemRepository.findByMemberIdAndVariantId(7L, 3L)
                .orElseThrow().getQuantity());
        assertEquals(1, cartItemRepository.findByMemberIdAndVariantId(7L, 4L)
                .orElseThrow().getQuantity());
        assertEquals(2, cartItemRepository.findByMemberIdAndVariantId(8L, 3L)
                .orElseThrow().getQuantity());
    }

    private CreateOrderRequest request() {
        return new CreateOrderRequest("測試收件人", "0912345678", "測試地址", "HOME", "COD",
                null, null, null, null, List.of(new CreateOrderRequest.OrderItemRequest(3L, 2)));
    }
}
