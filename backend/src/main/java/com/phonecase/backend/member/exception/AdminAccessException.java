package com.phonecase.backend.member.exception;

// 已登入但不是管理員（role 不是 ADMIN），回應 403
public class AdminAccessException extends RuntimeException {

    public AdminAccessException(String message) {
        super(message);
    }
}
