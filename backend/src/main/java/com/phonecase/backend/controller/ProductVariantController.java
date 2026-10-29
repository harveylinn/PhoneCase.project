package com.phonecase.backend.controller;

import com.phonecase.backend.dto.ProductVariantRequest;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.service.ProductVariantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{productId}/variants")
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    public ProductVariantController (ProductVariantService productVariantService){
        this.productVariantService = productVariantService;
    }

    @PostMapping
    public ProductVariant addVariant(
            @PathVariable("productId") Long productId,
            @Valid@RequestBody ProductVariantRequest request){
        return productVariantService.addVariant(productId, request);
    }

    @PutMapping("/{id}")
    public ProductVariant updateVariant(
            @PathVariable("productId") Long productId,
            @PathVariable("id") Long id,
            @Valid@RequestBody ProductVariantRequest request){
        return productVariantService.updateVariant(productId, id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteVariant(
            @PathVariable("productId") Long productId,
            @PathVariable("id") Long id){
        productVariantService.deleteVariant(productId, id);
    }

    @PatchMapping("/{id}/status")
    public ProductVariant updateStatus(
            @PathVariable("productId") Long productId,
            @PathVariable("id") Long id,
            @RequestParam String status) {
        return productVariantService.updateStatus(productId, id, status);
    }



}
