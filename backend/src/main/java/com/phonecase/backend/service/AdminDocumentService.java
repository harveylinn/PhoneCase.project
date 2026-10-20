package com.phonecase.backend.service;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.*;
import com.phonecase.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminDocumentService {

    private static final String SALES_ORDER = "訂單";
    private static final String PURCHASE_ORDER = "採購單";
    private static final String STOCK_IN = "入庫單";
    private static final String STOCK_OUT = "出庫單";

    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockInRepository stockInRepository;
    private final StockOutRepository stockOutRepository;
    private final InventoryService inventoryService;

    public AdminDocumentService(
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            StockInRepository stockInRepository,
            StockOutRepository stockOutRepository,
            InventoryService inventoryService) {
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockInRepository = stockInRepository;
        this.stockOutRepository = stockOutRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public BaseDocument createDocument(AdminDocumentRequest request) {
        String docType = request.getDocType();
        DocumentRepository<BaseDocument> repository = repositoryOf(docType);

        if (request.getOrderNo() == null || request.getOrderNo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "單號不可空白"
            );
        }
        String orderNo = request.getOrderNo().trim();
        if (repository.existsByOrderNo(orderNo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "單號已存在：" + orderNo
            );
        }

        BaseDocument document = newDocument(docType);
        document.setOrderNo(orderNo);
        applyRequest(document, request);
        applyStock(docType, document, 1);

        return repository.save(document);
    }

    @Transactional(readOnly = true)
    public List<BaseDocument> searchDocuments(String docType, String keyword, String operator) {
        DocumentRepository<BaseDocument> repository = repositoryOf(docType);

        if (keyword == null || keyword.isBlank()) {
            return repository.findAllByOrderByOrderNoDesc();
        }
        String no = keyword.trim();

        return switch (operator == null ? "=" : operator) {
            case "=" -> repository.findByOrderNo(no).map(List::of).orElse(List.of());
            case "%" -> repository.findByOrderNoContainingOrderByOrderNoDesc(no);
            case ">=" -> repository.findByOrderNoGreaterThanEqualOrderByOrderNoAsc(no);
            case "<=" -> repository.findByOrderNoLessThanEqualOrderByOrderNoDesc(no);
            case ">" -> repository.findByOrderNoGreaterThanOrderByOrderNoAsc(no);
            case "<" -> repository.findByOrderNoLessThanOrderByOrderNoDesc(no);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "不支援的搜尋條件：" + operator
            );
        };
    }

    @Transactional(readOnly = true)
    public BaseDocument getDocument(String docType, String orderNo) {
        return repositoryOf(docType)
                .findByOrderNo(orderNo)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到" + docType + "，單號" + orderNo
                        )
                );
    }

    // 入庫單、出庫單：先撤銷舊內容對庫存的影響，再套用新內容
    @Transactional
    public BaseDocument updateDocument(String docType, String orderNo, AdminDocumentRequest request) {
        BaseDocument existingDocument = getDocument(docType, orderNo);
        applyStock(docType, existingDocument, -1);
        applyRequest(existingDocument, request);
        applyStock(docType, existingDocument, 1);
        return repositoryOf(docType).save(existingDocument);
    }

    // 入庫單、出庫單：刪除時撤銷該單對庫存的影響
    @Transactional
    public void deleteDocument(String docType, String orderNo) {
        BaseDocument existingDocument = getDocument(docType, orderNo);
        applyStock(docType, existingDocument, -1);
        repositoryOf(docType).delete(existingDocument);
    }

    // direction：1 = 套用單據，-1 = 撤銷單據
    // 只有入庫單會增加庫存、只有出庫單會減少庫存；訂單與採購單不影響庫存
    private void applyStock(String docType, BaseDocument document, int direction) {
        int quantity = document.getQuantity() * direction;
        if (STOCK_IN.equals(docType)) {
            inventoryService.changeQuantity(
                    document.getProductName(), document.getModel(), document.getColor(), quantity);
        } else if (STOCK_OUT.equals(docType)) {
            inventoryService.changeQuantity(
                    document.getProductName(), document.getModel(), document.getColor(), -quantity);
        }
    }

    // 共用欄位，總計一律由後端以 數量 × 單價 計算
    private void applyRequest(BaseDocument document, AdminDocumentRequest request) {
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

    @SuppressWarnings("unchecked")
    private DocumentRepository<BaseDocument> repositoryOf(String docType) {
        DocumentRepository<? extends BaseDocument> repository = switch (docType == null ? "" : docType) {
            case SALES_ORDER -> salesOrderRepository;
            case PURCHASE_ORDER -> purchaseOrderRepository;
            case STOCK_IN -> stockInRepository;
            case STOCK_OUT -> stockOutRepository;
            default -> throw invalidDocType();
        };
        return (DocumentRepository<BaseDocument>) repository;
    }

    private BaseDocument newDocument(String docType) {
        return switch (docType) {
            case SALES_ORDER -> new SalesOrder();
            case PURCHASE_ORDER -> new PurchaseOrder();
            case STOCK_IN -> new StockIn();
            case STOCK_OUT -> new StockOut();
            default -> throw invalidDocType();
        };
    }

    private ResponseStatusException invalidDocType() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "單據類型只能是訂單、採購單、入庫單或出庫單"
        );
    }
}