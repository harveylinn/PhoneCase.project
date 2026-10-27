
package com.phonecase.backend.cart.repository;

import com.phonecase.backend.cart.entity.CartItem;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(
        scanBasePackages = "com.phonecase.backend.cart.repository.testonly"
)
@EntityScan(basePackageClasses = CartItem.class)
@EnableJpaRepositories(
        basePackageClasses = CartItemRepository.class
)
class CartJpaTestApplication {
}
