package com.phonecase.backend.member.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.phonecase.backend.member.dto.RegisterRequest;

/* 
前端註冊資料格式:
{
  "account": "test001",
  "password": "test123456",
  "name": "測試會員",
  "phone": "0912345678",
  "email": "test001@example.com"
}
  */

@RestController
@RequestMapping("/api/member")
public class MemberController {
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(Map.<String,Object>of("success", true, "message", "後端收到註冊資料"));
    }
}
