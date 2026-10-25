package com.phonecase.backend.controller;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.BaseDocument;
import com.phonecase.backend.entity.Inventory;
import com.phonecase.backend.service.AdminDocumentService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/documents")
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;

    public AdminDocumentController(AdminDocumentService adminDocumentService) {
        this.adminDocumentService = adminDocumentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BaseDocument createDocument(@Valid @RequestBody AdminDocumentRequest request) {
        return adminDocumentService.createDocument(request);
    }

    @GetMapping("/search")
    public List<BaseDocument> searchDocuments(
            @RequestParam String docType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "=") String operator) {
        return adminDocumentService.searchDocuments(docType, keyword, operator);
    }

    // 銷售統計：date 為瀏覽器日期，格式 yyyy-MM-dd
    @GetMapping("/stats")
    public AdminDocumentService.SalesStats getSalesStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return adminDocumentService.getSalesStats(date);
    }

    // 庫存異常報告：庫存數量低於安全庫存量
    @GetMapping("/alerts/inventory")
    public List<Inventory> getInventoryAlerts() {
        return adminDocumentService.getInventoryAlerts();
    }

    // 訂單異常報告：訂單日期超過 3 天仍未出貨，date 為瀏覽器日期，格式 yyyy-MM-dd
    @GetMapping("/alerts/orders")
    public List<AdminDocumentService.OrderAlert> getOrderAlerts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return adminDocumentService.getOrderAlerts(date);
    }

    @GetMapping("/{orderNo}")
    public BaseDocument getDocument(
            @PathVariable String orderNo,
            @RequestParam String docType) {
        return adminDocumentService.getDocument(docType, orderNo);
    }

    @PutMapping("/{orderNo}")
    public BaseDocument updateDocument(
            @PathVariable String orderNo,
            @RequestParam String docType,
            @Valid @RequestBody AdminDocumentRequest request) {
        return adminDocumentService.updateDocument(docType, orderNo, request);
    }

    @DeleteMapping("/{orderNo}")
    public void deleteDocument(
            @PathVariable String orderNo,
            @RequestParam String docType) {
        adminDocumentService.deleteDocument(docType, orderNo);
    }
}