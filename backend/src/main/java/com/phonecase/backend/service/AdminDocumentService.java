package com.phonecase.backend.service;

import com.phonecase.backend.dto.AdminDocumentRequest;
import com.phonecase.backend.entity.*;
import com.phonecase.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
public class AdminDocumentService {

    private static final String SALES_ORDER = "訂單";
    private static final String PURCHASE_ORDER = "採購單";
    private static final String STOCK_IN = "入庫單";
    private static final String STOCK_OUT = "出庫單";
    private static final String INVENTORY = "庫存";

    // 訂單編號格式為 YYMMDDNNNN
    private static final DateTimeFormatter ORDER_DATE_PREFIX = DateTimeFormatter.ofPattern("yyMMdd");

    // 銷售統計回傳格式：today = 今日、month = 本月
    public record SalesStats(SalesPeriod today, SalesPeriod month) {
    }

    // amount 銷售金額、quantity 銷售數量、orders 訂單數量
    // bestQuantity 最佳銷售單品的銷售數量、bestProducts 最佳銷售單品（數量相同時全部列出）
    public record SalesPeriod(long amount, long quantity, long orders,
            long bestQuantity, List<BestProduct> bestProducts) {
    }

    public record BestProduct(String productNo, String productName) {
    }

    // 訂單異常報告：訂單日期超過 3 天仍未出貨
    private static final int ORDER_OVERDUE_DAYS = 3;
    private static final List<String> SHIPPED_STATUSES = List.of("已出貨", "已完成", "已取消");

    // order 訂單、orderDate 訂單日期（由訂單編號前 6 碼取得）、days 距今天數
    public record OrderAlert(SalesOrder order, LocalDate orderDate, long days) {
    }

    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final StockInRepository stockInRepository;
    private final StockOutRepository stockOutRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;
    private final ShopSyncService shopSyncService;

    public AdminDocumentService(
            SalesOrderRepository salesOrderRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            StockInRepository stockInRepository,
            StockOutRepository stockOutRepository,
            InventoryRepository inventoryRepository,
            InventoryService inventoryService,
            ShopSyncService shopSyncService) {
        this.salesOrderRepository = salesOrderRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.stockInRepository = stockInRepository;
        this.stockOutRepository = stockOutRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryService = inventoryService;
        this.shopSyncService = shopSyncService;
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
        applyProductNo(document, request.getProductNo(), true);
        applyReference(document, request.getRefNo(), true);
        applyStock(docType, document.getProductName(), document.getModel(),
                document.getColor(), document.getQuantity());
        pushInventoryToShop(document);

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
        applyProductNo(existingDocument, request.getProductNo(), false);
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
        pushInventoryToShop(existingDocument);

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

        if (existingDocument instanceof Inventory && shopSyncService.isShopSku(no)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "品號 " + no + " 為商城商品規格，請先在商品管理刪除該規格"
            );
        }

        applyStock(docType, existingDocument.getProductName(), existingDocument.getModel(),
                existingDocument.getColor(), -existingDocument.getQuantity());
        repositoryOf(docType).delete(existingDocument);
    }

    // 銷售統計只計算訂單（sales_order），日期由前端依瀏覽器日期傳入
    @Transactional(readOnly = true)
    public SalesStats getSalesStats(LocalDate date) {
        String dayPrefix = date.format(ORDER_DATE_PREFIX);
        String monthPrefix = dayPrefix.substring(0, 4);
        return new SalesStats(salesPeriodOf(dayPrefix), salesPeriodOf(monthPrefix));
    }

    private SalesPeriod salesPeriodOf(String orderNoPrefix) {
        SalesOrderRepository.SalesSummary summary =
                salesOrderRepository.summarizeByOrderNoPrefix(orderNoPrefix);

        List<SalesOrderRepository.BestSeller> bestSellers =
                salesOrderRepository.findBestSellersByOrderNoPrefix(orderNoPrefix);

        long bestQuantity = bestSellers.isEmpty() ? 0 : bestSellers.get(0).getTotalQuantity().longValue();
        List<BestProduct> bestProducts = bestSellers.stream()
                .map(best -> new BestProduct(best.getProductNo(), best.getProductName()))
                .toList();

        return new SalesPeriod(
                summary.getAmount().longValue(),
                summary.getQuantity().longValue(),
                summary.getOrders().longValue(),
                bestQuantity,
                bestProducts);
    }

    // 庫存異常報告：庫存數量低於安全庫存量的品項全部列出
    @Transactional(readOnly = true)
    public List<Inventory> getInventoryAlerts() {
        return inventoryRepository.findBelowSafetyStock();
    }

    // 訂單異常報告：訂單日期超過 3 天（早於 date - 3 天）且狀態不是已出貨、已完成、已取消
    // 日期由前端依瀏覽器日期傳入
    @Transactional(readOnly = true)
    public List<OrderAlert> getOrderAlerts(LocalDate date) {
        LocalDate cutoff = date.minusDays(ORDER_OVERDUE_DAYS);

        return salesOrderRepository.findUnshippedBefore(cutoff, SHIPPED_STATUSES).stream()
                .map(order -> {
                    LocalDate orderDate = LocalDate.parse(order.getOrderNo().substring(0, 6), ORDER_DATE_PREFIX);
                    return new OrderAlert(order, orderDate, ChronoUnit.DAYS.between(orderDate, date));
                })
                .toList();
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
        document.setBrand(trimToNull(request.getBrand()));
        document.setColor(trimToNull(request.getColor()));
        document.setModel(trimToNull(request.getModel()));
        document.setQuantity(request.getQuantity());
        document.setUnitPrice(request.getUnitPrice());
        document.setTotalPrice(request.getQuantity() * request.getUnitPrice());
        document.setCustomerName(trimToNull(request.getCustomerName()));
        // 訂單的客戶名稱對應到會員時，自動帶入客戶代號（M + 會員 id）
        if (document instanceof SalesOrder) {
            document.setCustomerId(shopSyncService.findCustomerCode(document.getCustomerName()));
        }
    }

    // 後台直接新增、修改「庫存」時，數量同步到商城商品規格
    private void pushInventoryToShop(BaseDocument document) {
        if (document instanceof Inventory inventory) {
            shopSyncService.pushStockToVariant(inventory.getOrderNo(), inventory.getQuantity());
        }
    }

    // 品號：訂單、採購單、入庫單、出庫單為 product_no 欄位（varchar(50)、不可空白）
    // 新增時必填；修改時沒有傳入就沿用原本的品號；庫存的品號為主鍵，不在這裡處理
    private void applyProductNo(BaseDocument document, String productNo, boolean required) {
        if (document instanceof Inventory) {
            return;
        }

        String no = trimToNull(productNo);
        if (no == null) {
            if (required) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "品號不可空白"
                );
            }
            return;
        }
        if (no.length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "品號長度不可超過 50 碼"
            );
        }
        document.setProductNo(no);
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