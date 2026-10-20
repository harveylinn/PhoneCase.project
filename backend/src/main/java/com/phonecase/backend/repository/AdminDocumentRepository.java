package com.phonecase.backend.repository;

import com.phonecase.backend.entity.AdminDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminDocumentRepository
        extends JpaRepository<AdminDocument, Long> {

    Optional<AdminDocument> findByOrderNo(String orderNo);

    boolean existsByOrderNo(String orderNo);

    List<AdminDocument> findByDocTypeOrderByOrderNoDesc(String docType);

    // 依搜尋運算子查詢單號：= % >= <= > <
    List<AdminDocument> findByDocTypeAndOrderNo(String docType, String orderNo);

    List<AdminDocument> findByDocTypeAndOrderNoContainingOrderByOrderNoDesc(String docType, String orderNo);

    List<AdminDocument> findByDocTypeAndOrderNoGreaterThanEqualOrderByOrderNoAsc(String docType, String orderNo);

    List<AdminDocument> findByDocTypeAndOrderNoLessThanEqualOrderByOrderNoDesc(String docType, String orderNo);

    List<AdminDocument> findByDocTypeAndOrderNoGreaterThanOrderByOrderNoAsc(String docType, String orderNo);

    List<AdminDocument> findByDocTypeAndOrderNoLessThanOrderByOrderNoDesc(String docType, String orderNo);
}