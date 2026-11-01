package com.phonecase.backend.service;

import com.phonecase.backend.entity.Inventory;
import com.phonecase.backend.repository.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

// 庫存數量的唯一來源是 inventory.quantity；商城規格 product_variants.stock 只是鏡像
@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ShopSyncService shopSyncService;

    public InventoryService(InventoryRepository inventoryRepository, ShopSyncService shopSyncService) {
        this.inventoryRepository = inventoryRepository;
        this.shopSyncService = shopSyncService;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAllByOrderByProductNameAscModelAscColorAsc();
    }

    // 不加 public：只有同 package 的 AdminDocumentService（入庫單、出庫單）能異動庫存
    // 以唯一品號原子增減（UPDATE quantity = quantity + delta），不先讀再寫，避免同時異動時覆蓋彼此
    // inventory 的主鍵為品號，無法自動產生，找不到品項時請先在「庫存」新增
    void changeQuantity(String productNo, int delta) {
        if (delta == 0) {
            return;
        }

        if (inventoryRepository.addQuantity(productNo, delta) == 1) {
            // 商城商品規格的庫存以 inventory 為準更新（品號 = SKU）
            shopSyncService.mirrorStockToVariant(productNo);
            return;
        }

        // 沒有更新到任何一筆：品號不存在，或扣除後會變成負數
        Inventory inventory = inventoryRepository.findByOrderNo(productNo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "庫存中找不到品號：" + productNo + "，請先在「庫存」新增此品項"
                ));
        String item = inventory.getProductName()
                + " / " + Objects.toString(inventory.getModel(), "-")
                + " / " + Objects.toString(inventory.getColor(), "-");
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "庫存不足：品號 " + productNo + "（" + item + "）"
                        + "，目前庫存 " + inventory.getQuantity()
                        + "，需要扣除 " + (-delta)
        );
    }
}
