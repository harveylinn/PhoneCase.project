
package com.phonecase.backend.cart.repository;

import com.phonecase.backend.cart.entity.CartItem;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;


import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ContextConfiguration(classes = CartJpaTestApplication.class)
@AutoConfigureTestDatabase(
        replace = AutoConfigureTestDatabase.Replace.NONE
)
@ActiveProfiles("test")
class CartItemRepositoryIntegrationTest {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private DataSource dataSource;

    @Test
    void shouldSaveAndFindCartItem() throws Exception {

        // 1. 安全檢查：確認不是連到團隊資料庫
        try (Connection connection = dataSource.getConnection()) {
            String databaseName = connection.getCatalog();

            assertEquals(
                    "phonecase_test_db",
                    databaseName,
                    "測試必須使用獨立資料庫"
            );
        }

        // 2. 建立測試購物車項目
        CartItem item = new CartItem();
        item.setMemberId(900001L);
        item.setVariantId(900101L);
        item.setQuantity(2);

        // 3. 真正執行 JPA 儲存
        CartItem savedItem = cartItemRepository.saveAndFlush(item);

        // 4. 確認 MySQL 產生了主鍵
        assertNotNull(savedItem.getId());

        // 5. 真正執行 JPA 查詢
        Optional<CartItem> result =
                cartItemRepository.findByMemberIdAndVariantId(
                        900001L,
                        900101L
                );

        // 6. 驗證查詢結果
        assertTrue(result.isPresent());
        assertEquals(2, result.get().getQuantity());
        assertEquals(900001L, result.get().getMemberId());
        assertEquals(900101L, result.get().getVariantId());
    }


    @Test
    void shouldRejectDuplicateMemberAndVariant() {

        // 1. 建立第一筆購物車商品
        CartItem firstItem = new CartItem();
        firstItem.setMemberId(900002L);
        firstItem.setVariantId(900102L);
        firstItem.setQuantity(1);

        cartItemRepository.saveAndFlush(firstItem);

        // 2. 建立第二筆：相同會員、相同規格
        CartItem duplicateItem = new CartItem();
        duplicateItem.setMemberId(900002L);
        duplicateItem.setVariantId(900102L);
        duplicateItem.setQuantity(3);

        // 3. 驗證資料庫拒絕重複資料
        assertThrows(
                org.springframework.dao.DataIntegrityViolationException.class,
                () -> cartItemRepository.saveAndFlush(duplicateItem)
        );
    }

}
