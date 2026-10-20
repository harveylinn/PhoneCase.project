package com.phonecase.backend.repository;

import com.phonecase.backend.entity.BaseDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
import java.util.Optional;

// 四種單據共用的查詢方法，本身不會被建立成 Bean
@NoRepositoryBean
public interface DocumentRepository<T extends BaseDocument>
        extends JpaRepository<T, Long> {

    Optional<T> findByOrderNo(String orderNo);

    boolean existsByOrderNo(String orderNo);

    List<T> findAllByOrderByOrderNoDesc();

    // 依搜尋運算子查詢單號：% >= <= > <
    List<T> findByOrderNoContainingOrderByOrderNoDesc(String orderNo);

    List<T> findByOrderNoGreaterThanEqualOrderByOrderNoAsc(String orderNo);

    List<T> findByOrderNoLessThanEqualOrderByOrderNoDesc(String orderNo);

    List<T> findByOrderNoGreaterThanOrderByOrderNoAsc(String orderNo);

    List<T> findByOrderNoLessThanOrderByOrderNoDesc(String orderNo);
}