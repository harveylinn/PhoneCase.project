package com.phonecase.backend.repository;

import com.phonecase.backend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

import java.util.List;
import java.util.Optional;

public interface ProductRepository
        extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = {
            "variants"
    })
    Optional<Product> findById(Long id);

    @EntityGraph(attributePaths = {
            "variants"
    })
    List<Product> findByStatus(String status);

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByCategory(String category);

    List<Product> findDistinctByVariants_ModelIgnoreCase(String model);

    @Query("""
    SELECT DISTINCT p
    FROM Product p
    JOIN p.variants v
    WHERE (:keyword IS NULL OR
           LOWER(p.name) LIKE
           LOWER(CONCAT('%', :keyword, '%')))
      AND (:category IS NULL OR p.category = :category)
      AND (:model IS NULL OR
           LOWER(v.model) = LOWER(:model))
      AND (:minPrice IS NULL OR v.price >= :minPrice)
      AND (:maxPrice IS NULL OR v.price <= :maxPrice)
    """)
    List<Product> filterProducts(
            @Param("keyword") String keyword,
            @Param("category") String category,
            @Param("model") String model,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice
    );

}
