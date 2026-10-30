package com.phonecase.backend.controller;

import com.phonecase.backend.service.CrmService;
import com.phonecase.backend.service.ShopSyncService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin")
public class AdminCrmController {

    private final CrmService crmService;
    private final ShopSyncService shopSyncService;

    public AdminCrmController(CrmService crmService, ShopSyncService shopSyncService) {
        this.crmService = crmService;
        this.shopSyncService = shopSyncService;
    }

    // 簡易 CRM：date 為瀏覽器日期，格式 yyyy-MM-dd
    @GetMapping("/crm")
    public CrmService.CrmReport getCrmReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return crmService.getReport(date);
    }

    // 立即同步商城資料（商品規格、商城訂單），後台頁面開啟時呼叫
    @PostMapping("/sync")
    public ShopSyncService.SyncResult syncShopData() {
        return shopSyncService.syncAll();
    }
}
