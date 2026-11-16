package com.phonecase.backend.product.service;

import com.phonecase.backend.product.dto.ProductRequest;
import com.phonecase.backend.product.entity.Product;
import com.phonecase.backend.product.entity.ProductVariant;
import com.phonecase.backend.product.repository.ProductRepository;
import com.phonecase.backend.service.ShopSyncService;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;


// 修改、刪除、上下架商品與同步後台庫存在同一個交易：同步失敗時商品一起回滾，API 回報失敗時資料也沒有寫入
// 同步以 JdbcTemplate 讀取資料表，呼叫前先 flush，讓同步讀到這次修改後的商品
@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ShopSyncService shopSyncService;

    public ProductService(ProductRepository productRepository, ShopSyncService shopSyncService) {
        this.productRepository = productRepository;
        this.shopSyncService = shopSyncService;
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

    @Transactional
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
        Product saved = productRepository.save(existingProduct);
        productRepository.flush();
        // 商品名稱、上下架同步到後台庫存
        shopSyncService.syncProduct(saved.getId());
        return saved;

    }

    @Transactional
    public void deleteProduct(Long id){
        Product existingProduct = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + id
                        )
                );
        List<String> skus = existingProduct.getVariants() == null ? List.of()
                : existingProduct.getVariants().stream().map(ProductVariant::getSku).toList();
        productRepository.delete(existingProduct);
        productRepository.flush();
        // 後台庫存保留紀錄，只清空上架狀態
        shopSyncService.unlinkSkus(skus);
    }

    @Transactional
    public Product updateStatus(Long id, String status){
        Product existingProduct = getProductById(id);

        if(!status.equals("上架")&& !status.equals("下架")){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "商品狀態只能是上架或下架"
            );
        }
        existingProduct.setStatus(status);
        Product saved = productRepository.save(existingProduct);
        productRepository.flush();
        shopSyncService.syncProduct(saved.getId());
        return saved;
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
