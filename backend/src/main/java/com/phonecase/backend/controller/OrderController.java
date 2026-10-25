package com.phonecase.backend.controller;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.service.OrderService;
import com.phonecase.backend.order.service.OrderQueryService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(
        origins = {
                "http://localhost:5173",
                "http://localhost:5174"
        },
        allowCredentials = "true"
)
public class OrderController {

    private final OrderService orderService;
    private final OrderQueryService orderQueryService;

    public OrderController(
            OrderService orderService,
            OrderQueryService orderQueryService
    ) {
        this.orderService = orderService;
        this.orderQueryService = orderQueryService;
    }

    // =====================================
    // 1. 原本的測試 API
    // =====================================

    @GetMapping("/test")
    public String test() {
        return "訂單 API 測試成功";
    }

    // =====================================
    // 2. 從 Session 取得會員 ID
    // =====================================

    private Long getMemberId(HttpServletRequest request) {

        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入會員"
            );
        }

        Object value = session.getAttribute("memberId");

        if (!(value instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "找不到會員登入資訊"
            );
        }

        return ((Number) value).longValue();
    }

    // =====================================
    // 3. 建立訂單
    // POST /api/orders
    // =====================================

    @PostMapping
    public Map<String, Object> createOrder(
            @RequestBody CreateOrderRequest orderData,
            HttpServletRequest request
    ) {

        Long memberId = getMemberId(request);

        OrderEntity savedOrder =
                orderService.createOrder(orderData, memberId);

        return Map.of(
                "success", true,
                "message", "訂單建立成功",
                "orderNumber", savedOrder.getOrderNumber(),
                "orderId", savedOrder.getId(),
                "totalAmount", savedOrder.getTotalAmount(),
                "status", savedOrder.getOrderStatus()
        );
    }

    // =====================================
    // 4. 查詢我的訂單（新增）
    // GET /api/orders
    // =====================================

    @GetMapping
    public List<OrderQueryService.OrderView> getOrders(
            HttpServletRequest request
    ) {

        Long memberId = getMemberId(request);

        return orderQueryService.getOrders(memberId);
    }

    // =====================================
    // 5. 取消訂單（新增）
    // POST /api/orders/{orderNumber}/cancel
    // =====================================

    @PostMapping("/{orderNumber}/cancel")
    public Map<String, Object> cancelOrder(
            @PathVariable String orderNumber,
            HttpServletRequest request
    ) {

        Long memberId = getMemberId(request);

        orderQueryService.cancelOrder(
                orderNumber,
                memberId
        );

        return Map.of(
                "success", true,
                "message", "訂單已取消"
        );
    }
}
