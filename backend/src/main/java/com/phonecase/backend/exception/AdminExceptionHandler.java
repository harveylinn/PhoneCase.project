package com.phonecase.backend.exception;

import com.phonecase.backend.controller.AdminDocumentController;
import com.phonecase.backend.controller.AdminShopController;
import com.phonecase.backend.controller.InventoryController;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// 只處理後台單據、庫存與後台管理頁面 API 的錯誤，保留 Service 拋出的狀態碼：
// 404 找不到、409 單號重複、庫存不足或訂單狀態不可變更、400 資料錯誤
// 優先順序高於 GlobalExceptionHandler，其他組員的 API 仍由 GlobalExceptionHandler 處理
@RestControllerAdvice(assignableTypes = {
        AdminDocumentController.class,
        AdminShopController.class,
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

    // 資料庫限制錯誤：外鍵、長度、必填欄位等
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityError(
            DataIntegrityViolationException exception) {
        Map<String, String> error = new HashMap<>();
        error.put("message", "資料不符合資料庫限制（關聯單號不存在、仍被其他單據引用或欄位過長）");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
}