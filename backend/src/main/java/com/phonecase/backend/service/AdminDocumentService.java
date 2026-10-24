package com.phonecase.backend.service;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.*;
import com.phonecase.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class AdminDocumentService {

    private static final String SALES_ORDER = "訂單";
    private static final String PURCHASE_ORDER = "採購單";
    private static final String STOCK_IN = "入庫單";
    private static final String STOCK_OUT = "出庫單";
    private static final String INVENTORY = "庫存";

    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockInRepository stockInRepository;
    private final StockOutRepository stockOutRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    public AdminDocumentService(
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            StockInRepository stockInRepository,
            StockOutRepository stockOutRepository,
            InventoryRepository inventoryRepository,
            InventoryService inventoryService) {
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockInRepository = stockInRepository;
        this.stockOutRepository = stockOutRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public BaseDocument createDocument(AdminDocumentRequest request) {
        String docType = request.getDocType();
        DocumentRepository<BaseDocument> repository = repositoryOf(docType);

        String orderNo = requireOrderNo(docType, request.getOrderNo());
        if (repository.existsByOrderNo(orderNo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "單號已存在：" + orderNo
            );
        }

        BaseDocument document = newDocument(docType);
        document.setOrderNo(orderNo);
        applyRequest(document, request);
        applyReference(document, request.getRefNo(), true);
        applyStock(docType, document.getProductName(), document.getModel(),
                document.getColor(), document.getQuantity());

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
                .findByOrderNo(orderNo == null ? null : orderNo.trim())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到" + docType + "，單號" + orderNo
                        )
                );
    }

    // 入庫單、出庫單：同一品項只異動數量差額；換了品項則先撤銷舊品項再套用新品項
    @Transactional
    public BaseDocument updateDocument(String docType, String orderNo, AdminDocumentRequest request) {
        BaseDocument existingDocument = getDocument(docType, orderNo);

        String oldProductName = existingDocument.getProductName();
        String oldModel = existingDocument.getModel();
        String oldColor = existingDocument.getColor();
        int oldQuantity = existingDocument.getQuantity();

        applyRequest(existingDocument, request);
        applyReference(existingDocument, request.getRefNo(), false);

        boolean sameItem = Objects.equals(oldProductName, existingDocument.getProductName())
                && Objects.equals(oldModel, existingDocument.getModel())
                && Objects.equals(oldColor, existingDocument.getColor());
        if (sameItem) {
            applyStock(docType, oldProductName, oldModel, oldColor,
                    existingDocument.getQuantity() - oldQuantity);
        } else {
            applyStock(docType, oldProductName, oldModel, oldColor, -oldQuantity);
            applyStock(docType, existingDocument.getProductName(), existingDocument.getModel(),
                    existingDocument.getColor(), existingDocument.getQuantity());
        }

        return repositoryOf(docType).save(existingDocument);
    }

    // 入庫單、出庫單：刪除時撤銷該單對庫存的影響
    // 訂單、採購單：已被出庫單、入庫單引用時不可刪除（資料表外鍵）
    @Transactional
    public void deleteDocument(String docType, String orderNo) {
        BaseDocument existingDocument = getDocument(docType, orderNo);
        String no = existingDocument.getOrderNo();

        if (existingDocument instanceof SalesOrder
                && stockOutRepository.existsBySalesOrderNo(no)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "訂單 " + no + " 已有出庫單，請先刪除對應的出庫單"
            );
        }
        if (existingDocument instanceof PurchaseOrder
                && stockInRepository.existsByPurchaseNo(no)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "採購單 " + no + " 已有入庫單，請先刪除對應的入庫單"
            );
        }

        applyStock(docType, existingDocument.getProductName(), existingDocument.getModel(),
                existingDocument.getColor(), -existingDocument.getQuantity());
        repositoryOf(docType).delete(existingDocument);
    }

    // quantity 為正數 = 套用單據，負數 = 撤銷單據
    // 只有入庫單會增加庫存、只有出庫單會減少庫存；訂單、採購單、庫存本身不影響庫存
    private void applyStock(String docType, String productName, String model, String color, int quantity) {
        if (STOCK_IN.equals(docType)) {
            inventoryService.changeQuantity(productName, model, color, quantity);
        } else if (STOCK_OUT.equals(docType)) {
            inventoryService.changeQuantity(productName, model, color, -quantity);
        }
    }

    // 共用欄位，總計一律由後端以 數量 × 單價 計算
    private void applyRequest(BaseDocument document, AdminDocumentRequest request) {
        document.setProductName(request.getProductName().trim());
        document.setColor(trimToNull(request.getColor()));
        document.setModel(trimToNull(request.getModel()));
        document.setQuantity(request.getQuantity());
        document.setUnitPrice(request.getUnitPrice());
        document.setTotalPrice(request.getQuantity() * request.getUnitPrice());
        document.setCustomerName(trimToNull(request.getCustomerName()));
    }

    // 入庫單需對應採購單、出庫單需對應訂單（資料表外鍵）
    // 新增時必填；修改時沒有傳入就沿用原本的單號
    private void applyReference(BaseDocument document, String refNo, boolean required) {
        String ref = trimToNull(refNo);

        if (document instanceof StockIn stockIn) {
            if (ref == null) {
                if (required) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "入庫單必須填寫對應的採購單號（refNo）"
                    );
                }
                return;
            }
            if (!purchaseOrderRepository.existsByOrderNo(ref)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "找不到採購單，單號" + ref
                );
            }
            stockIn.setPurchaseNo(ref);
        } else if (document instanceof StockOut stockOut) {
            if (ref == null) {
                if (required) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "出庫單必須填寫對應的訂單號（refNo）"
                    );
                }
                return;
            }
            if (!salesOrderRepository.existsByOrderNo(ref)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "找不到訂單，單號" + ref
                );
            }
            stockOut.setSalesOrderNo(ref);
        }
    }

    // 單據編號為 char(10)、品號為 varchar(50)
    private String requireOrderNo(String docType, String orderNo) {
        String label = INVENTORY.equals(docType) ? "品號" : "單號";
        int maxLength = INVENTORY.equals(docType) ? 50 : 10;

        String no = trimToNull(orderNo);
        if (no == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + "不可空白"
            );
        }
        if (no.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + "長度不可超過 " + maxLength + " 碼"
            );
        }
        return no;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @SuppressWarnings("unchecked")
    private DocumentRepository<BaseDocument> repositoryOf(String docType) {
        DocumentRepository<? extends BaseDocument> repository = switch (docType == null ? "" : docType) {
            case SALES_ORDER -> salesOrderRepository;
            case PURCHASE_ORDER -> purchaseOrderRepository;
            case STOCK_IN -> stockInRepository;
            case STOCK_OUT -> stockOutRepository;
            case INVENTORY -> inventoryRepository;
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
            case INVENTORY -> new Inventory();
            default -> throw invalidDocType();
        };
    }

    private ResponseStatusException invalidDocType() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "單據類型只能是訂單、採購單、入庫單、出庫單或庫存"
        );
    }
}