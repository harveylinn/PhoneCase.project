package com.phonecase.backend.cart.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "cart_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_member_variant",
                columnNames = {"member_id", "variant_id"}

        )
)
@Getter
@Setter
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "variant_id", nullable = false)
    private Long variantId;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;


}
