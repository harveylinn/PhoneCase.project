package com.phonecase.backend.service;

import com.phonecase.backend.dto.ProductRequest;
import com.phonecase.backend.entity.Product;
import com.phonecase.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;


@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts(){
        return productRepository.findAll();
    }

    public Product getProductById(Long id){
        return productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
    }

    public List<Product> getAvailableProducts(){
        return productRepository.findByStatus("上架");
    }

    public List<Product> searchProducts(String keyword){
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<Product> getProductsByCategory(String category){
        return productRepository.findByCategory(category);
    }

    public List<Product> getProductsByModel(String model){
        return productRepository.findDistinctByVariants_ModelIgnoreCase(model);
    }

    public List<Product> filterProducts(
            String keyword,
            String category,
            String model,
            BigDecimal minPrice,
            BigDecimal maxPrice){
        return productRepository.filterProducts(keyword, category, model, minPrice, maxPrice);
    }

    public  Product addProduct(ProductRequest request){
        validateStatus(request.getStatus());
        Product product = new Product();

        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setDescription(request.getDescription());
        product.setStatus(request.getStatus());

        return productRepository.save(product);
    }

    public Product updateProduct(Long id, ProductRequest request){
        validateStatus(request.getStatus());
        Product existingProduct = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
        existingProduct.setName(request.getName());
        existingProduct.setCategory(request.getCategory());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setStatus(request.getStatus());
        return productRepository.save(existingProduct);

    }

    public void deleteProduct(Long id){
        Product existingProduct = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
        productRepository.delete(existingProduct);
    }

    public Product updateStatus(Long id, String status){
        Product existingProduct = getProductById(id);

        if(!status.equals("上架")&& !status.equals("下架")){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "商品狀態只能是上架或下架"
            );
        }
        existingProduct.setStatus(status);
        return productRepository.save(existingProduct);
    }

    private void validateStatus(String status) {
        if (!"上架".equals(status) && !"下架".equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "商品狀態只能是上架或下架"
            );
        }
    }
}
