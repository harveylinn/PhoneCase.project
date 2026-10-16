package com.example.phonecase.controller;

import com.example.phonecase.dto.ProductRequest;
import com.example.phonecase.entity.Product;
import com.example.phonecase.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Provider;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getAllProducts(){
        return productService.getAllProducts();
    }

    @GetMapping("/available")
    public List<Product> getAvailableProducts(){
        return productService.getAvailableProducts();
    }

    @GetMapping("/search")
    public List<Product> searchProducts(@RequestParam String keyword){
        return productService.searchProducts(keyword);
    }

    @GetMapping("/category")
    public List<Product> getProductsByCategory(@RequestParam String category){
        return productService.getProductsByCategory(category);
    }

    @GetMapping("/model")
    public List<Product> getProductsByModel(@RequestParam String model){
        return productService.getProductsByModel(model);
    }

    @GetMapping("/filter")
    public List<Product> filterProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice){
        return productService.filterProducts(keyword, category, model, minPrice, maxPrice);
    }

    @PostMapping
    public Product addProduct(@Valid@RequestBody ProductRequest request){
        return productService.addProduct(request);
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,
            @Valid@RequestBody ProductRequest request){
        return productService.updateProduct(id, request);
    }

    @PatchMapping("/{id}/status")
    public Product updateStatus(
            @PathVariable("id") Long id,
            @RequestParam String status){
        return productService.updateStatus(id, status);
    }

    @GetMapping("/{id}")
    public Product getProductById(@PathVariable Long id){
        return productService.getProductById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(
            @PathVariable("id") Long id){
        productService.deleteProduct(id);
    }





}
