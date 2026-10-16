package com.example.phonecase.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductImageRequest {

    @NotBlank(message = "商品圖片路徑不可為空")
    private String imageUrl;

    @NotNull(message = "圖片排序不可為空")
    @Min(value = 1, message = "圖片排序至少為 1")
    private Integer sortOrder;

    @NotNull(message = "是否為主圖不可為空")
    private Boolean isPrimary;
}