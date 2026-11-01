package com.phonecase.backend.controller;

import com.phonecase.backend.member.security.CheckAdmin;
import com.phonecase.backend.service.AdminShopService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

// 後台管理頁面：總覽、商城訂單、會員狀態、未上架商品上架
// 後台 API：需要管理員登入
@CheckAdmin
@RestController
@RequestMapping("/api/admin")
public class AdminShopController {

    private final AdminShopService adminShopService;

    public AdminShopController(AdminShopService adminShopService) {
        this.adminShopService = adminShopService;
    }

    // 後台頁面開啟時確認登入者是管理員；未登入回 401、不是管理員回 403
    @GetMapping("/session")
    public Map<String, Object> getSession(HttpServletRequest request) {
        return Map.of("memberId", request.getAttribute("authenticatedMemberId"));
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
    // 出貨（SHIPPED）時自動建立出庫單並扣庫存，回傳建立的出庫單編號
    @PatchMapping("/orders/{id}/status")
    public AdminShopService.StatusChangeResult updateOrderStatus(@PathVariable Long id,
            @RequestBody Map<String, String> body, HttpServletRequest request) {
        return adminShopService.updateOrderStatus(id, body.get("status"),
                (Long) request.getAttribute("authenticatedMemberId"));
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
