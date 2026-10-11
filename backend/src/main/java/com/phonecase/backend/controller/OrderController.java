package com.phonecase.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

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
            @RequestBody Map<String, Object> orderData) {

        System.out.println("收到訂單資料：" + orderData);

        return Map.of(
                "success", true,
                "message", "後端已收到訂單資料"
        );
    }
}