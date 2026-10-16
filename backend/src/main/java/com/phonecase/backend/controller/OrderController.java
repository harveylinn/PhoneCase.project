package com.phonecase.backend.controller;

import com.phonecase.backend.dto.CreateOrderRequest;
import com.phonecase.backend.order.entity.OrderEntity;
import com.phonecase.backend.order.service.OrderService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(
        origins = "http://localhost:5173",
        allowCredentials = "true"
)
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // =========================================
    // 保留原本的測試 API
    // =========================================

    @GetMapping("/test")
    public String test() {
        return "訂單 API 測試成功";
    }

    // =========================================
    // 建立訂單
    // =========================================

    @PostMapping
    public Map<String, Object> createOrder(
            @RequestBody CreateOrderRequest orderData,
            HttpServletRequest request
    ) {

        // 從登入 Session 取得會員 ID
        HttpSession session = request.getSession(false);

        if (session == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "請先登入會員"
            );
        }

        Object memberIdValue = session.getAttribute("memberId");

        if (!(memberIdValue instanceof Number)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "找不到會員登入資訊"
            );
        }

        Long memberId = ((Number) memberIdValue).longValue();

        // 呼叫 Service，真正儲存到資料庫
        OrderEntity savedOrder =
                orderService.createOrder(orderData, memberId);

        // 回傳建立成功的訂單資訊
        return Map.of(
                "success", true,
                "message", "訂單建立成功",
                "orderNumber", savedOrder.getOrderNumber(),
                "orderId", savedOrder.getId(),
                "totalAmount", savedOrder.getTotalAmount(),
                "status", savedOrder.getOrderStatus()
        );
    }

}