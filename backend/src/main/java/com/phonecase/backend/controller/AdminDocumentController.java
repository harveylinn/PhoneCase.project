package com.phonecase.backend.controller;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.BaseDocument;
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