package com.phonecase.backend.service;

import com.phonecase.backend.dto.ProductImageRequest;
import com.phonecase.backend.entity.ProductImage;
import com.phonecase.backend.entity.ProductVariant;
import com.phonecase.backend.repository.ProductImageRepository;
import com.phonecase.backend.repository.ProductVariantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductImageService {

    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductVariantRepository productVariantRepository,
                               ProductImageRepository productImageRepository){
        this.productVariantRepository = productVariantRepository;
        this.productImageRepository = productImageRepository;
    }

    public ProductImage addImage(
            Long variantId,
            ProductImageRequest request){

        ProductImage image = new ProductImage();

        image.setImageUrl(request.getImageUrl());
        image.setSortOrder(request.getSortOrder());
        image.setIsPrimary(request.getIsPrimary());
        ProductVariant variant = productVariantRepository
                .findById(variantId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id:" + variantId
                        ));
        image.setVariant(variant);
        clearPreviousPrimary(variantId, image.getIsPrimary(), null);
        return productImageRepository.save(image);
    }

    public ProductImage updateImage(
            Long variantId,
            Long imageId,
            ProductImageRequest request){
        ProductImage existingImage = productImageRepository
                .findById(imageId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "找不到商品，id" + imageId
                        ));
        if (!existingImage.getVariant().getId().equals(variantId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "此商品規格不屬於指定商品"
            );
        }
        existingImage.setImageUrl(request.getImageUrl());
        existingImage.setSortOrder(request.getSortOrder());
        existingImage.setIsPrimary(request.getIsPrimary());
        clearPreviousPrimary(variantId, existingImage.getIsPrimary(), imageId);
        return productImageRepository.save(existingImage);
    }

    public void deleteImage(
            Long variantId,
            Long imageId) {

        ProductImage existingImage = productImageRepository
                .findById(imageId)
                .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "找不到商品，id" + imageId
                    ));

        if (!existingImage.getVariant().getId().equals(variantId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "此商品規格不屬於指定商品"
            );
        }

        productImageRepository.delete(existingImage);
    }

    private void clearPreviousPrimary(
            Long variantId,
            Boolean isPrimary,
            Long exceptImageId) {
        if (!Boolean.TRUE.equals(isPrimary)) {
            return;
        }

        List<ProductImage> primaryImages =
                productImageRepository.findByVariantIdAndIsPrimaryTrue(variantId);
        primaryImages.stream()
                .filter(image -> exceptImageId == null
                        || !image.getId().equals(exceptImageId))
                .forEach(image -> image.setIsPrimary(false));
        productImageRepository.saveAll(primaryImages);
    }

}
