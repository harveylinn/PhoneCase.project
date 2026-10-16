package com.phonecase.backend.controller;

import com.phonecase.backend.dto.ProductImageRequest;
import com.phonecase.backend.entity.ProductImage;
import com.phonecase.backend.service.ProductImageService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/variants/{variantId}/images")
public class ProductImageController {

    private final ProductImageService productImageService;

    public ProductImageController (ProductImageService productImageService){
        this.productImageService = productImageService;
    }

    @PostMapping
    public ProductImage addImage(
            @PathVariable("variantId") Long variantId,
            @Valid@RequestBody ProductImageRequest request){
        return productImageService.addImage(variantId, request);
    }

    @PutMapping("/{imageId}")
    public ProductImage updateImage(
            @PathVariable("variantId") Long variantId,
            @PathVariable("imageId") Long imageId,
            @Valid@RequestBody ProductImageRequest request) {
        return productImageService.updateImage(
                variantId, imageId, request);
    }

    @DeleteMapping("/{imageId}")
    public void deleteImage(
            @PathVariable("variantId") Long variantId,
            @PathVariable("imageId") Long imageId) {
        productImageService.deleteImage(variantId, imageId);
    }

}
