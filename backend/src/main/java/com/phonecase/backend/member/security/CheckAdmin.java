package com.phonecase.backend.member.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// 後台 API：需要有效的 JWT、帳號狀態 ACTIVE，且會員角色為 ADMIN
// 可加在 Controller 類別（整個類別的 API 都檢查）或單一方法上
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckAdmin {

}
