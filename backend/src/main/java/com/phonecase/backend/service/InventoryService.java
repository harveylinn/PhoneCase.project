package com.phonecase.backend.service;

import com.phonecase.backend.entity.Inventory;
import com.phonecase.backend.repository.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    public InventoryService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAllByOrderByProductNameAscModelAscColorAsc();
    }

    // 不加 public：只有同 package 的 AdminDocumentService（入庫單、出庫單）能異動庫存
    void changeQuantity(String productName, String model, String color, int delta) {
        String name = normalize(productName);
        String itemModel = normalize(model);
        String itemColor = normalize(color);

        Inventory inventory = inventoryRepository
                .findByProductNameAndModelAndColor(name, itemModel, itemColor)
                .orElseGet(() -> {
                    Inventory newItem = new Inventory();
                    newItem.setProductName(name);
                    newItem.setModel(itemModel);
                    newItem.setColor(itemColor);
                    newItem.setQuantity(0);
                    return newItem;
                });

        int newQuantity = inventory.getQuantity() + delta;
        if (newQuantity < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "庫存不足：" + name + " " + itemModel + " " + itemColor
                            + "，目前庫存 " + inventory.getQuantity()
                            + "，需要扣除 " + (-delta)
            );
        }

        inventory.setQuantity(newQuantity);
        inventoryRepository.save(inventory);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}