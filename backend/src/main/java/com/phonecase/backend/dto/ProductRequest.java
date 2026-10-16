package com.example.phonecase.dto;

import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "商品名稱不可以空白")
    private String name;

    @NotBlank(message = "商品分類不可空白")
    private String category;

    private String description;

    @NotBlank(message = "商品狀態不可空白")
    private String status;
}
