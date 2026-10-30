package com.phonecase.backend.member.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.phonecase.backend.member.dto.LoginRequest;
import com.phonecase.backend.member.exception.JwtAuthenticationException;
import com.phonecase.backend.member.exception.LoginException;
import com.phonecase.backend.member.exception.RegistrationException;

@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = MemberController.class)
public class MemberExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(Map.of(
                "success", false, "message", "JSON 格式或欄位不正確。"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();

        for (var error : exception.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> responseData = Map.of("success", false,
                "message", "請檢查輸入資料",
                "errors", errors);

        return ResponseEntity.badRequest().body(responseData);
    }
    /*
     * 註冊資料錯誤，回傳: { "success": false, "message": "請檢查註冊資料。", "errors": { "account":
     * "請輸入帳號。", "password": "密碼至少需要 8 個字元。" } }
     */

    @ExceptionHandler(RegistrationException.class)
    public ResponseEntity<Map<String, Object>> handleRegistration(RegistrationException exception) {
        return ResponseEntity.badRequest().body(Map.<String, Object>of(
                "success", false,
                "message", exception.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException exception) {
        return ResponseEntity.status(409).body(
                Map.<String, Object>of(
                        "success", false,
                        "message", "資料與資料庫限制衝突，請確認帳號、Email或其他欄位。"));

    }

    @ExceptionHandler(LoginException.class)
    public ResponseEntity<Map<String, Object>> handleLogin(LoginException exception) {

        return ResponseEntity.status(401).body(
                Map.<String, Object>of(
                        "success", false,
                        "message", exception.getMessage()));
    }

    @ExceptionHandler(JwtAuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleJwtAuthentication(
            JwtAuthenticationException exception) {

        return ResponseEntity.status(401).body(
                Map.<String, Object>of(
                        "success", false,
                        "message", exception.getMessage()));
    }

}
