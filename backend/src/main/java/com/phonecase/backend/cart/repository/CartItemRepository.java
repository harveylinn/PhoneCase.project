package com.phonecase.backend.cart.repository;

import com.phonecase.backend.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByMemberId(Long memberId);

    Optional<CartItem> findByMemberIdAndVariantId(
        Long memberId,
        Long variantId
    );
}
