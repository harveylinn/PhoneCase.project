package com.phonecase.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Setter
@Getter
public class ProductVariantRequest {

    @NotBlank(message = "商品品牌不可空白")
    private String brand;

    @NotBlank(message = "商品型號不可空白")
    private String model;

    @NotBlank(message = "商品顏色不可空白")
    private  String color;

    @NotNull(message = "商品價格不可為空")
    @DecimalMin(value = "0.0", message = "商品價格不可小於0")
    private BigDecimal price;

    @Min(value = 0, message = "商品數量不可小於 0")
    private Integer stock;

    @NotBlank(message = "商品編號不可空白")
    private String sku;

    @NotBlank(message = "商品狀態不可空白")
    private String status;

    private String tags;
}
