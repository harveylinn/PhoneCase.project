package com.phonecase.backend.controller;

import com.phonecase.backend.service.AdminShopService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// 後台管理頁面：總覽、商城訂單、會員狀態、未上架商品上架
@RestController
@RequestMapping("/api/admin")
public class AdminShopController {

    private final AdminShopService adminShopService;

    public AdminShopController(AdminShopService adminShopService) {
        this.adminShopService = adminShopService;
    }

    // date 為瀏覽器日期，格式 yyyy-MM-dd
    @GetMapping("/overview")
    public AdminShopService.Overview getOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return adminShopService.getOverview(date);
    }

    // filter：all、unpaid（未結帳）、unshipped（未出貨）、unpicked（未取貨）
    @GetMapping("/orders")
    public List<AdminShopService.ShopOrder> getOrders(@RequestParam(defaultValue = "all") String filter) {
        return adminShopService.getOrders(filter);
    }

    // body：{ "status": "SHIPPED" | "COMPLETED" | "CANCELLED" }
    @PatchMapping("/orders/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        adminShopService.updateOrderStatus(id, body.get("status"));
    }

    // body：{ "status": "ACTIVE" | "SUSPENDED" }
    @PatchMapping("/members/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateMemberStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        adminShopService.updateMemberStatus(id, body.get("status"));
    }

    @PostMapping("/inventory/{productNo}/publish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publishInventory(@PathVariable String productNo,
            @RequestBody AdminShopService.PublishRequest request) {
        adminShopService.publishInventory(productNo, request);
    }
}
