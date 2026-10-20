package com.phonecase.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AdminDocumentRequest {

    // 新增時必填；修改時以網址上的單號為準，不會更改類型與單號
    private String docType;

    private String orderNo;

    @NotBlank(message = "品名不可空白")
    private String productName;

    private String color;

    private String model;

    @NotNull(message = "數量不可空白")
    @Min(value = 1, message = "數量至少為 1")
    private Integer quantity;

    @NotNull(message = "單價不可空白")
    @DecimalMin(value = "0", message = "單價不可小於 0")
    private BigDecimal unitPrice;

    private String customerName;
}