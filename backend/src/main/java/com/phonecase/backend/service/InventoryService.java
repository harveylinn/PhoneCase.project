package com.phonecase.backend.service;

import com.phonecase.backend.entity.Inventory;
import com.phonecase.backend.repository.InventoryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

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
    // inventory 的主鍵為品號，無法自動產生，找不到品項時請先在「庫存」新增
    void changeQuantity(String productName, String model, String color, int delta) {
        if (delta == 0) {
            return;
        }

        String item = productName
                + " / " + Objects.toString(model, "-")
                + " / " + Objects.toString(color, "-");

        Inventory inventory = inventoryRepository
                .findByProductNameAndModelAndColor(productName, model, color)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "庫存中找不到品項：" + item + "，請先在「庫存」新增此品項"
                ));

        int newQuantity = inventory.getQuantity() + delta;
        if (newQuantity < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "庫存不足：" + item
                            + "，目前庫存 " + inventory.getQuantity()
                            + "，需要扣除 " + (-delta)
            );
        }

        inventory.setQuantity(newQuantity);
        inventory.setTotalPrice(newQuantity * inventory.getUnitPrice());
        inventoryRepository.save(inventory);
    }
}