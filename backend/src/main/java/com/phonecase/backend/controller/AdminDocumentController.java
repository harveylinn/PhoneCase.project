package com.phonecase.backend.controller;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.AdminDocument;
import com.phonecase.backend.service.AdminDocumentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
    public AdminDocument createDocument(@Valid @RequestBody AdminDocumentRequest request) {
        return adminDocumentService.createDocument(request);
    }

    @GetMapping("/search")
    public List<AdminDocument> searchDocuments(
            @RequestParam String docType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "=") String operator) {
        return adminDocumentService.searchDocuments(docType, keyword, operator);
    }

    @GetMapping("/{orderNo}")
    public AdminDocument getDocument(@PathVariable String orderNo) {
        return adminDocumentService.getDocument(orderNo);
    }

    @PutMapping("/{orderNo}")
    public AdminDocument updateDocument(
            @PathVariable String orderNo,
            @Valid @RequestBody AdminDocumentRequest request) {
        return adminDocumentService.updateDocument(orderNo, request);
    }

    @DeleteMapping("/{orderNo}")
    public void deleteDocument(@PathVariable String orderNo) {
        adminDocumentService.deleteDocument(orderNo);
    }
}