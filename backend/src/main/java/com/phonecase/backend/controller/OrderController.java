package com.phonecase.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.phonecase.backend.dto.CreateOrderRequest;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    @GetMapping("/test")
    public String test() {
        return "訂單 API 測試成功";
    }

    @PostMapping
    public Map<String, Object> createOrder(
            @RequestBody CreateOrderRequest orderData) {

        System.out.println("收到訂單資料：" + orderData);

        System.out.println("收件人：" + orderData.receiverName());
        System.out.println("電話：" + orderData.receiverPhone());
        System.out.println("配送方式：" + orderData.shippingMethod());
        System.out.println("付款方式：" + orderData.paymentMethod());

        return Map.of(
                "success", true,
                "message", "後端已收到訂單資料");
    }
}