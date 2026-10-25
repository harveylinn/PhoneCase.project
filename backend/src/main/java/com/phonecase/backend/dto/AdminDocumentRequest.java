package com.phonecase.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminDocumentRequest {

    // 新增時必填；修改時以網址上的單號為準，不會更改類型與單號
    // 類型：訂單、採購單、入庫單、出庫單、庫存
    private String docType;

    // 單號（庫存為品號）
    private String orderNo;

    // 品號：訂單、採購單、入庫單、出庫單新增時必填；庫存的品號以 orderNo 為準
    private String productNo;

    @NotBlank(message = "品名不可空白")
    private String productName;

    private String brand;

    private String color;

    private String model;

    @NotNull(message = "數量不可空白")
    @Min(value = 0, message = "數量不可小於 0")
    private Integer quantity;

    @NotNull(message = "單價不可空白")
    @Min(value = 0, message = "單價不可小於 0")
    private Integer unitPrice;

    // 訂單為客戶名稱，其他單據為供應商名稱
    private String customerName;

    // 入庫單：對應的採購單號；出庫單：對應的訂單號（資料表外鍵，新增時必填）
    private String refNo;
}