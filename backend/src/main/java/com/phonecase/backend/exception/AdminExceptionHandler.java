package com.phonecase.backend.exception;

import com.phonecase.backend.controller.AdminDocumentController;
import com.phonecase.backend.controller.InventoryController;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// 只處理後台單據與庫存 API 的錯誤，保留 Service 拋出的狀態碼：
// 404 找不到、409 單號重複或庫存不足、400 資料錯誤
// 優先順序高於 GlobalExceptionHandler，其他組員的 API 仍由 GlobalExceptionHandler 處理
@RestControllerAdvice(assignableTypes = {
        AdminDocumentController.class,
        InventoryController.class
})
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AdminExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusError(
            ResponseStatusException exception) {
        Map<String, String> error = new HashMap<>();
        error.put("message", exception.getReason() == null
                ? "操作失敗"
                : exception.getReason());
        return ResponseEntity.status(exception.getStatusCode()).body(error);
    }
}

