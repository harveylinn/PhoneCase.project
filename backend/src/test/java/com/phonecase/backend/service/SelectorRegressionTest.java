package com.phonecase.backend.service;
import com.phonecase.backend.dto.*;
import com.phonecase.backend.entity.*;
import com.phonecase.backend.repository.*;
import org.junit.jupiter.api.Test;
import jakarta.validation.Validation;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SelectorRegressionTest {
    ProductVariantRequest request() {
        var r = new ProductVariantRequest();
        r.setBrand("Apple"); r.setModel("iPhone"); r.setColor("black");
        r.setPrice(BigDecimal.TEN); r.setSku("TEST-1"); r.setStatus("上架");
        return r;
    }
    @Test void omittedStockIsValidButNegativeStockIsRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var r = request();
            assertTrue(factory.getValidator().validate(r).isEmpty());
            r.setStock(-1);
            assertFalse(factory.getValidator().validate(r).isEmpty());
        }
    }
    @Test void createDefaultsStockToZero() {
        var products = mock(ProductRepository.class);
        var variants = mock(ProductVariantRepository.class);
        var product = new Product(); product.setId(1L);
        when(products.findById(1L)).thenReturn(Optional.of(product));
        when(variants.save(any(ProductVariant.class))).thenAnswer(i -> i.getArgument(0));
        assertEquals(0, new ProductVariantService(variants, products).addVariant(1L, request()).getStock());
    }
    @Test void editingWithoutStockPreservesExistingInventory() {
        var products = mock(ProductRepository.class);
        var variants = mock(ProductVariantRepository.class);
        var product = new Product(); product.setId(1L);
        var existing = new ProductVariant(); existing.setProduct(product); existing.setStock(23);
        when(variants.findById(2L)).thenReturn(Optional.of(existing));
        when(variants.save(any(ProductVariant.class))).thenAnswer(i -> i.getArgument(0));
        var service = new ProductVariantService(variants, products);
        assertEquals(23, service.updateVariant(1L, 2L, request()).getStock());
        var explicit = request(); explicit.setStock(0);
        assertEquals(0, service.updateVariant(1L, 2L, explicit).getStock());
    }
    @Test void bothRecommendationPathsExcludeDisabledVariants() {
        var products = mock(ProductService.class);
        var product = new Product(); product.setId(1L);
        var live = new ProductVariant(); live.setId(2L); live.setBrand("Apple"); live.setStock(4); live.setStatus("上架");
        var disabled = new ProductVariant(); disabled.setId(3L); disabled.setBrand("Apple"); disabled.setStock(8); disabled.setStatus("下架");
        product.setVariants(List.of(disabled, live));
        when(products.getAvailableProducts()).thenReturn(List.of(product));
        var service = new ProductRecommendationService(products);
        var criteria = new AiVisionResult("Apple", null, null, null, null, null);
        assertEquals(List.of(2L), service.findMatches(criteria, "Apple").stream().map(AiProductRecommendation::variantId).toList());
        assertEquals(List.of(2L), service.findSimilar(criteria, "Apple").stream().map(AiProductRecommendation::variantId).toList());
    }
}
