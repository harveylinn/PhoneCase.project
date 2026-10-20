package com.phonecase.backend.service;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.AdminDocument;
import com.phonecase.backend.repository.AdminDocumentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
public class AdminDocumentService {

    private static final Set<String> DOC_TYPES =
            Set.of("訂單", "採購單", "入庫單", "出庫單");

    private final AdminDocumentRepository adminDocumentRepository;

    public AdminDocumentService(AdminDocumentRepository adminDocumentRepository) {
        this.adminDocumentRepository = adminDocumentRepository;
    }

    public AdminDocument createDocument(AdminDocumentRequest request) {
        validateDocType(request.getDocType());

        if (request.getOrderNo() == null || request.getOrderNo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "單號不可空白"
            );
        }
        String orderNo = request.getOrderNo().trim();
        if (adminDocumentRepository.existsByOrderNo(orderNo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "單號已存在：" + orderNo
            );
        }

        AdminDocument document = new AdminDocument();
        document.setDocType(request.getDocType());
        document.setOrderNo(orderNo);
        applyRequest(document, request);

        return adminDocumentRepository.save(document);
    }

    public List<AdminDocument> searchDocuments(String docType, String keyword, String operator) {
        validateDocType(docType);

        if (keyword == null || keyword.isBlank()) {
            return adminDocumentRepository.findByDocTypeOrderByOrderNoDesc(docType);
        }
        String no = keyword.trim();

        return switch (operator == null ? "=" : operator) {
            case "=" -> adminDocumentRepository.findByDocTypeAndOrderNo(docType, no);
            case "%" -> adminDocumentRepository.findByDocTypeAndOrderNoContainingOrderByOrderNoDesc(docType, no);
            case ">=" -> adminDocumentRepository.findByDocTypeAndOrderNoGreaterThanEqualOrderByOrderNoAsc(docType, no);
            case "<=" -> adminDocumentRepository.findByDocTypeAndOrderNoLessThanEqualOrderByOrderNoDesc(docType, no);
            case ">" -> adminDocumentRepository.findByDocTypeAndOrderNoGreaterThanOrderByOrderNoAsc(docType, no);
            case "<" -> adminDocumentRepository.findByDocTypeAndOrderNoLessThanOrderByOrderNoDesc(docType, no);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "不支援的搜尋條件：" + operator
            );
        };
    }

    public AdminDocument getDocument(String orderNo) {
        return adminDocumentRepository
                .findByOrderNo(orderNo)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到單據，單號" + orderNo
                        )
                );
    }

    public AdminDocument updateDocument(String orderNo, AdminDocumentRequest request) {
        AdminDocument existingDocument = getDocument(orderNo);
        applyRequest(existingDocument, request);
        return adminDocumentRepository.save(existingDocument);
    }

    public void deleteDocument(String orderNo) {
        AdminDocument existingDocument = getDocument(orderNo);
        adminDocumentRepository.delete(existingDocument);
    }

    // 共用欄位，總計一律由後端以 數量 × 單價 計算
    private void applyRequest(AdminDocument document, AdminDocumentRequest request) {
        document.setProductName(request.getProductName());
        document.setColor(request.getColor());
        document.setModel(request.getModel());
        document.setQuantity(request.getQuantity());
        document.setUnitPrice(request.getUnitPrice());
        document.setTotalPrice(
                request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity()))
        );
        document.setCustomerName(request.getCustomerName());
    }

    private void validateDocType(String docType) {
        if (docType == null || !DOC_TYPES.contains(docType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "單據類型只能是訂單、採購單、入庫單或出庫單"
            );
        }
    }
}